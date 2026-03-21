// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'gym_house_public.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not allowed to use it. The `sealed` modifier in the mixin enforces this.');

GymHousePublic _$GymHousePublicFromJson(Map<String, dynamic> json) {
  return _GymHousePublic.fromJson(json);
}

/// @nodoc
mixin _$GymHousePublic {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get address => throw _privateConstructorUsedError;

  /// Serializes this GymHousePublic to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of GymHousePublic
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $GymHousePublicCopyWith<GymHousePublic> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GymHousePublicCopyWith<$Res> {
  factory $GymHousePublicCopyWith(
          GymHousePublic value, $Res Function(GymHousePublic) then) =
      _$GymHousePublicCopyWithImpl<$Res, GymHousePublic>;
  @useResult
  $Res call({String id, String name, String address});
}

/// @nodoc
class _$GymHousePublicCopyWithImpl<$Res, $Val extends GymHousePublic>
    implements $GymHousePublicCopyWith<$Res> {
  _$GymHousePublicCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of GymHousePublic
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? address = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      address: null == address
          ? _value.address
          : address // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GymHousePublicImplCopyWith<$Res>
    implements $GymHousePublicCopyWith<$Res> {
  factory _$$GymHousePublicImplCopyWith(_$GymHousePublicImpl value,
          $Res Function(_$GymHousePublicImpl) then) =
      __$$GymHousePublicImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String address});
}

/// @nodoc
class __$$GymHousePublicImplCopyWithImpl<$Res>
    extends _$GymHousePublicCopyWithImpl<$Res, _$GymHousePublicImpl>
    implements _$$GymHousePublicImplCopyWith<$Res> {
  __$$GymHousePublicImplCopyWithImpl(
      _$GymHousePublicImpl _value, $Res Function(_$GymHousePublicImpl) _then)
      : super(_value, _then);

  /// Create a copy of GymHousePublic
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? address = null,
  }) {
    return _then(_$GymHousePublicImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      address: null == address
          ? _value.address
          : address // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GymHousePublicImpl implements _GymHousePublic {
  const _$GymHousePublicImpl(
      {required this.id, required this.name, required this.address});

  factory _$GymHousePublicImpl.fromJson(Map<String, dynamic> json) =>
      _$$GymHousePublicImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String address;

  @override
  String toString() {
    return 'GymHousePublic(id: $id, name: $name, address: $address)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GymHousePublicImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.address, address) || other.address == address));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, address);

  /// Create a copy of GymHousePublic
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$GymHousePublicImplCopyWith<_$GymHousePublicImpl> get copyWith =>
      __$$GymHousePublicImplCopyWithImpl<_$GymHousePublicImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GymHousePublicImplToJson(
      this,
    );
  }
}

abstract class _GymHousePublic implements GymHousePublic {
  const factory _GymHousePublic(
      {required final String id,
      required final String name,
      required final String address}) = _$GymHousePublicImpl;

  factory _GymHousePublic.fromJson(Map<String, dynamic> json) =
      _$GymHousePublicImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get address;

  /// Create a copy of GymHousePublic
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$GymHousePublicImplCopyWith<_$GymHousePublicImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

GymHousePublicList _$GymHousePublicListFromJson(Map<String, dynamic> json) {
  return _GymHousePublicList.fromJson(json);
}

/// @nodoc
mixin _$GymHousePublicList {
  List<GymHousePublic> get items => throw _privateConstructorUsedError;

  /// Serializes this GymHousePublicList to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of GymHousePublicList
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $GymHousePublicListCopyWith<GymHousePublicList> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GymHousePublicListCopyWith<$Res> {
  factory $GymHousePublicListCopyWith(
          GymHousePublicList value, $Res Function(GymHousePublicList) then) =
      _$GymHousePublicListCopyWithImpl<$Res, GymHousePublicList>;
  @useResult
  $Res call({List<GymHousePublic> items});
}

/// @nodoc
class _$GymHousePublicListCopyWithImpl<$Res, $Val extends GymHousePublicList>
    implements $GymHousePublicListCopyWith<$Res> {
  _$GymHousePublicListCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of GymHousePublicList
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? items = null,
  }) {
    return _then(_value.copyWith(
      items: null == items
          ? _value.items
          : items // ignore: cast_nullable_to_non_nullable
              as List<GymHousePublic>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GymHousePublicListImplCopyWith<$Res>
    implements $GymHousePublicListCopyWith<$Res> {
  factory _$$GymHousePublicListImplCopyWith(_$GymHousePublicListImpl value,
          $Res Function(_$GymHousePublicListImpl) then) =
      __$$GymHousePublicListImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<GymHousePublic> items});
}

/// @nodoc
class __$$GymHousePublicListImplCopyWithImpl<$Res>
    extends _$GymHousePublicListCopyWithImpl<$Res, _$GymHousePublicListImpl>
    implements _$$GymHousePublicListImplCopyWith<$Res> {
  __$$GymHousePublicListImplCopyWithImpl(_$GymHousePublicListImpl _value,
      $Res Function(_$GymHousePublicListImpl) _then)
      : super(_value, _then);

  /// Create a copy of GymHousePublicList
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? items = null,
  }) {
    return _then(_$GymHousePublicListImpl(
      items: null == items
          ? _value._items
          : items // ignore: cast_nullable_to_non_nullable
              as List<GymHousePublic>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GymHousePublicListImpl implements _GymHousePublicList {
  const _$GymHousePublicListImpl({required final List<GymHousePublic> items})
      : _items = items;

  factory _$GymHousePublicListImpl.fromJson(Map<String, dynamic> json) =>
      _$$GymHousePublicListImplFromJson(json);

  final List<GymHousePublic> _items;
  @override
  List<GymHousePublic> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  String toString() {
    return 'GymHousePublicList(items: $items)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GymHousePublicListImpl &&
            const DeepCollectionEquality().equals(other._items, _items));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_items));

  /// Create a copy of GymHousePublicList
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$GymHousePublicListImplCopyWith<_$GymHousePublicListImpl> get copyWith =>
      __$$GymHousePublicListImplCopyWithImpl<_$GymHousePublicListImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GymHousePublicListImplToJson(
      this,
    );
  }
}

abstract class _GymHousePublicList implements GymHousePublicList {
  const factory _GymHousePublicList(
      {required final List<GymHousePublic> items}) = _$GymHousePublicListImpl;

  factory _GymHousePublicList.fromJson(Map<String, dynamic> json) =
      _$GymHousePublicListImpl.fromJson;

  @override
  List<GymHousePublic> get items;

  /// Create a copy of GymHousePublicList
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$GymHousePublicListImplCopyWith<_$GymHousePublicListImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
