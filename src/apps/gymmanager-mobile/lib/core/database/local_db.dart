import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../../features/booking/data/models/offline_booking.dart';

/// Abstract interface for the local offline-booking database.
///
/// Concrete implementation: [SqliteLocalDb].
/// Tests replace this with an in-memory stub.
abstract class LocalDb {
  Future<void> init();
  Future<void> insert(OfflineBooking booking);
  Future<void> updateStatus(
    String id,
    SyncStatus status, {
    String? failureReason,
  });
  Future<void> delete(String id);
  Future<List<OfflineBooking>> getAll();
  Future<List<OfflineBooking>> getPending();
  Future<void> close();
}

/// SQLite-backed [LocalDb] implementation.
///
/// Provides a singleton [Database] instance initialised lazily on first access.
/// All public methods are safe to call from any isolate once [init] completes.
class SqliteLocalDb implements LocalDb {
  SqliteLocalDb._();

  static final SqliteLocalDb instance = SqliteLocalDb._();

  static const _dbName = 'gymmanager.db';
  static const _dbVersion = 1;
  static const _tableOfflineBookings = 'offline_bookings';

  Database? _db;

  Future<Database> get _database async {
    _db ??= await _open();
    return _db!;
  }

  @override
  Future<void> init() async {
    _db = await _open();
  }

  Future<Database> _open() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, _dbName);

    return openDatabase(
      path,
      version: _dbVersion,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_tableOfflineBookings (
        id             TEXT PRIMARY KEY,
        time_slot_id   TEXT NOT NULL,
        booking_type   TEXT NOT NULL,
        payload        TEXT NOT NULL,
        created_at     TEXT NOT NULL,
        sync_status    TEXT NOT NULL DEFAULT 'pending',
        failure_reason TEXT
      )
    ''');
  }

  // ---------------------------------------------------------------------------
  // Write operations
  // ---------------------------------------------------------------------------

  @override
  Future<void> insert(OfflineBooking booking) async {
    final db = await _database;
    await db.insert(
      _tableOfflineBookings,
      booking.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  @override
  Future<void> updateStatus(
    String id,
    SyncStatus status, {
    String? failureReason,
  }) async {
    final db = await _database;
    await db.update(
      _tableOfflineBookings,
      {
        'sync_status': status.name,
        'failure_reason': failureReason,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  @override
  Future<void> delete(String id) async {
    final db = await _database;
    await db.delete(
      _tableOfflineBookings,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  @override
  Future<List<OfflineBooking>> getAll() async {
    final db = await _database;
    final rows = await db.query(_tableOfflineBookings);
    return rows.map(OfflineBooking.fromMap).toList();
  }

  @override
  Future<List<OfflineBooking>> getPending() async {
    final db = await _database;
    final rows = await db.query(
      _tableOfflineBookings,
      where: 'sync_status = ?',
      whereArgs: [SyncStatus.pending.name],
    );
    return rows.map(OfflineBooking.fromMap).toList();
  }

  @override
  Future<void> close() async {
    await _db?.close();
    _db = null;
  }
}
