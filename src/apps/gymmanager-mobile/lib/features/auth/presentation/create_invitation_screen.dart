import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../data/models/create_invitation_request.dart';
import '../data/models/gym_house_public.dart';
import '../data/models/invitation_response.dart';
import 'register_screen.dart' show gymHousesProvider;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/// Allows an owner or manager to invite a new user to a gym.
///
/// On success the invite URL is displayed so the owner can share it via any
/// channel (copy to clipboard, share sheet, etc.).
class CreateInvitationScreen extends ConsumerStatefulWidget {
  const CreateInvitationScreen({super.key});

  @override
  ConsumerState<CreateInvitationScreen> createState() =>
      _CreateInvitationScreenState();
}

class _CreateInvitationScreenState
    extends ConsumerState<CreateInvitationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  InvitationRole _selectedRole = InvitationRole.member;
  String? _selectedGymHouseId;
  bool _isSubmitting = false;
  InvitationResponse? _createdInvitation;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(value.trim())) return 'Enter a valid email address';
    return null;
  }

  String? _validateGymHouse(String? value) {
    if (value == null || value.isEmpty) return 'Please select a gym';
    return null;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.createInvitation(
        CreateInvitationRequest(
          email: _emailController.text.trim(),
          role: _selectedRole,
          gymHouseId: _selectedGymHouseId!,
        ),
      );

      setState(() => _createdInvitation = response);
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _reset() {
    _formKey.currentState?.reset();
    _emailController.clear();
    setState(() {
      _selectedRole = InvitationRole.member;
      _selectedGymHouseId = null;
      _createdInvitation = null;
    });
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final gymHousesAsync = ref.watch(gymHousesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Invite Member')),
      body: gymHousesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Could not load gyms. Please try again.'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => ref.invalidate(gymHousesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (gymHouses) => _createdInvitation != null
            ? _buildSuccessView(_createdInvitation!)
            : _buildForm(gymHouses),
      ),
    );
  }

  Widget _buildForm(List<GymHousePublic> gymHouses) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Send an Invitation',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 24),

            // Email
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Invitee Email',
                prefixIcon: Icon(Icons.email_outlined),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              validator: _validateEmail,
            ),
            const SizedBox(height: 16),

            // Role selector
            DropdownButtonFormField<InvitationRole>(
              value: _selectedRole,
              decoration: const InputDecoration(
                labelText: 'Role',
                prefixIcon: Icon(Icons.badge_outlined),
                border: OutlineInputBorder(),
              ),
              items: InvitationRole.values
                  .map(
                    (role) => DropdownMenuItem(
                      value: role,
                      child: Text(role.displayName),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) setState(() => _selectedRole = value);
              },
            ),
            const SizedBox(height: 16),

            // Gym selector
            DropdownButtonFormField<String>(
              value: _selectedGymHouseId,
              decoration: const InputDecoration(
                labelText: 'Gym',
                prefixIcon: Icon(Icons.fitness_center_outlined),
                border: OutlineInputBorder(),
              ),
              items: gymHouses
                  .map(
                    (gym) => DropdownMenuItem(
                      value: gym.id,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(gym.name),
                          Text(
                            gym.address,
                            style: Theme.of(context).textTheme.bodySmall,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (value) =>
                  setState(() => _selectedGymHouseId = value),
              validator: _validateGymHouse,
            ),
            const SizedBox(height: 28),

            // Submit
            FilledButton.icon(
              onPressed: _isSubmitting ? null : _submit,
              icon: _isSubmitting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_outlined),
              label: const Text('Send Invitation'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView(InvitationResponse invitation) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
          const SizedBox(height: 16),
          Text(
            'Invitation Sent',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'An invitation has been sent to ${invitation.email} as '
            '${invitation.role}.',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Invite Link',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    invitation.inviteUrl,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonalIcon(
                    onPressed: () {
                      Clipboard.setData(
                        ClipboardData(text: invitation.inviteUrl),
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Invite link copied to clipboard'),
                        ),
                      );
                    },
                    icon: const Icon(Icons.copy_outlined),
                    label: const Text('Copy Link'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Expires: ${invitation.expiresAt}',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: _reset,
            child: const Text('Send Another Invitation'),
          ),
        ],
      ),
    );
  }
}
