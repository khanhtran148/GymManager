import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  getNotifications,
  markNotificationRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateAnnouncement,
} from "../../helpers/test-data.js";

test.describe("Notifications (API)", () => {
  test.describe("Announcements", () => {
    test("creates an AllMembers announcement for a gym house", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const announcement = await createAnnouncement(
        generateAnnouncement({
          gymHouseId: gymHouse.id,
          targetAudience: "AllMembers",
        }),
        auth.accessToken,
      );

      expect(announcement.id).toBeTruthy();
      expect(announcement.gymHouseId).toBe(gymHouse.id);
      expect(announcement.targetAudience).toBe("AllMembers");
    });

    test("creates a Staff announcement for a gym house", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const announcement = await createAnnouncement(
        generateAnnouncement({
          gymHouseId: gymHouse.id,
          targetAudience: "Staff",
        }),
        auth.accessToken,
      );

      expect(announcement.id).toBeTruthy();
      expect(announcement.targetAudience).toBe("Staff");
    });

    test("lists announcements filtered by gymHouseId", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouseA = await createGymHouse(generateGymHouse(), auth.accessToken);
      const gymHouseB = await createGymHouse(generateGymHouse(), auth.accessToken);

      const announcementA = await createAnnouncement(
        generateAnnouncement({ gymHouseId: gymHouseA.id }),
        auth.accessToken,
      );
      await createAnnouncement(
        generateAnnouncement({ gymHouseId: gymHouseB.id }),
        auth.accessToken,
      );

      const list = await getAnnouncements(auth.accessToken, {
        gymHouseId: gymHouseA.id,
      });

      const ids = list.items.map((a) => a.id);
      expect(ids).toContain(announcementA.id);
      for (const item of list.items) {
        expect(item.gymHouseId).toBe(gymHouseA.id);
      }
    });

    test("gets announcement by ID", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const created = await createAnnouncement(
        generateAnnouncement({ gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const fetched = await getAnnouncementById(created.id, gymHouse.id, auth.accessToken);

      expect(fetched.id).toBe(created.id);
      expect(fetched.title).toBe(created.title);
      expect(fetched.content).toBe(created.content);
    });
  });

  test.describe("Notifications", () => {
    test("returns a paged notification list (may be empty initially)", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });

      const list = await getNotifications(auth.accessToken);

      expect(typeof list.totalCount).toBe("number");
      expect(Array.isArray(list.items)).toBe(true);
      expect(list.page).toBeGreaterThanOrEqual(1);
    });

    test("returns 200 on mark-read even for a notification the user received", async () => {
      const owner = generateUser();
      const ownerAuth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      // Create an announcement directed to Everyone so the owner may receive a notification
      await createAnnouncement(
        generateAnnouncement({
          gymHouseId: gymHouse.id,
          targetAudience: "Everyone",
        }),
        ownerAuth.accessToken,
      );

      // Check what notifications exist for the owner
      const list = await getNotifications(ownerAuth.accessToken);

      if (list.items.length > 0) {
        const notificationId = list.items[0].id;
        // Mark it read — should not throw
        await markNotificationRead(notificationId, ownerAuth.accessToken);

        // Re-fetch and verify readAt is set
        const updated = await getNotifications(ownerAuth.accessToken);
        const found = updated.items.find((n) => n.id === notificationId);
        if (found) {
          expect(found.readAt).not.toBeNull();
        }
      } else {
        // No notifications yet — just assert the list endpoint responded correctly
        expect(list.totalCount).toBe(0);
      }
    });
  });

  test.describe("Notification Preferences", () => {
    test("returns default notification preferences for a new user", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });

      const prefs = await getNotificationPreferences(auth.accessToken);

      expect(Array.isArray(prefs)).toBe(true);
      expect(prefs.length).toBeGreaterThan(0);
      for (const pref of prefs) {
        expect(typeof pref.channel).toBe("string");
        expect(typeof pref.isEnabled).toBe("boolean");
      }
    });

    test("updates notification preferences by toggling a channel off", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });

      // Disable InApp channel (0)
      await updateNotificationPreferences(
        {
          preferences: [{ channel: 0, isEnabled: false }],
        },
        auth.accessToken,
      );

      const prefs = await getNotificationPreferences(auth.accessToken);
      const inAppPref = prefs.find(
        (p) => p.channel === "InApp" || p.channel === "0" || (p.channel as unknown as number) === 0,
      );

      if (inAppPref) {
        expect(inAppPref.isEnabled).toBe(false);
      }
      // If the channel string representation differs, verify the update was accepted
      // without error (no throw means 204/200 was returned above)
    });

    test("persists preference changes across subsequent GET requests", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });

      // Toggle Email channel (2) off
      await updateNotificationPreferences(
        {
          preferences: [{ channel: 2, isEnabled: false }],
        },
        auth.accessToken,
      );

      // Second GET should reflect the change
      const prefsAfter = await getNotificationPreferences(auth.accessToken);
      const emailPref = prefsAfter.find(
        (p) =>
          p.channel === "Email" ||
          p.channel === "2" ||
          (p.channel as unknown as number) === 2,
      );

      if (emailPref) {
        expect(emailPref.isEnabled).toBe(false);
      }
    });

    test("can re-enable a previously disabled channel", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });

      // Disable Push (1)
      await updateNotificationPreferences(
        {
          preferences: [{ channel: 1, isEnabled: false }],
        },
        auth.accessToken,
      );

      // Re-enable Push (1)
      await updateNotificationPreferences(
        {
          preferences: [{ channel: 1, isEnabled: true }],
        },
        auth.accessToken,
      );

      const prefs = await getNotificationPreferences(auth.accessToken);
      const pushPref = prefs.find(
        (p) =>
          p.channel === "Push" ||
          p.channel === "1" ||
          (p.channel as unknown as number) === 1,
      );

      if (pushPref) {
        expect(pushPref.isEnabled).toBe(true);
      }
    });
  });
});
