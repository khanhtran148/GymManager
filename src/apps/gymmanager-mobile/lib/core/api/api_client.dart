import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/data/models/accept_invitation_request.dart';
import '../../features/auth/data/models/auth_response.dart';
import '../../features/auth/data/models/create_invitation_request.dart';
import '../../features/auth/data/models/gym_house_public.dart';
import '../../features/auth/data/models/invitation_response.dart';
import '../../features/auth/data/models/register_request.dart';

const _baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:5050/api/v1',
);

class ApiClient {
  ApiClient({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: _onRequest,
      onError: _onError,
    ));
  }

  late final Dio _dio;
  final FlutterSecureStorage _storage;

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      // TODO: implement token refresh
    }
    handler.next(err);
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    final response = await _dio.get<dynamic>(path, queryParameters: queryParameters);
    return fromJson != null ? fromJson(response.data) : response.data as T;
  }

  Future<T> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    final response = await _dio.post<dynamic>(path, data: data);
    return fromJson != null ? fromJson(response.data) : response.data as T;
  }

  Future<T> put<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    final response = await _dio.put<dynamic>(path, data: data);
    return fromJson != null ? fromJson(response.data) : response.data as T;
  }

  Future<void> delete(String path) async {
    await _dio.delete<dynamic>(path);
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  /// `POST /api/v1/auth/register`
  Future<AuthResponse> register(RegisterRequest request) {
    return post<AuthResponse>(
      '/auth/register',
      data: request.toJson(),
      fromJson: (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  // ---------------------------------------------------------------------------
  // Gym houses
  // ---------------------------------------------------------------------------

  /// `GET /api/v1/gym-houses/public`
  Future<List<GymHousePublic>> getPublicGymHouses() async {
    final result = await get<GymHousePublicList>(
      '/gym-houses/public',
      fromJson: (json) =>
          GymHousePublicList.fromJson(json as Map<String, dynamic>),
    );
    return result.items;
  }

  // ---------------------------------------------------------------------------
  // Invitations
  // ---------------------------------------------------------------------------

  /// `POST /api/v1/invitations`
  Future<InvitationResponse> createInvitation(
    CreateInvitationRequest request,
  ) {
    return post<InvitationResponse>(
      '/invitations',
      data: request.toJson(),
      fromJson: (json) =>
          InvitationResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  /// `POST /api/v1/invitations/{token}/accept`
  Future<AuthResponse> acceptInvitation(
    String token,
    AcceptInvitationRequest request,
  ) {
    return post<AuthResponse>(
      '/invitations/$token/accept',
      data: request.toJson(),
      fromJson: (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  // ---------------------------------------------------------------------------
  // Token storage helpers
  // ---------------------------------------------------------------------------

  /// Persists [accessToken] and [refreshToken] to secure storage.
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  /// Removes all stored auth tokens (logout).
  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}

// ---------------------------------------------------------------------------
// Riverpod provider
// ---------------------------------------------------------------------------

/// Singleton [ApiClient] available app-wide.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
