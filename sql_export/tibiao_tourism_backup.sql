-- Tibiao Tourism System Database SQL Export
-- Exported on: 2026-05-23T03:28:15.066Z

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Table structure for table `visitors`
DROP TABLE IF EXISTS `visitors`;
CREATE TABLE visitors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        age INTEGER,
        gender TEXT,
        resort TEXT,
        visitor_type TEXT,
        duration TEXT,
        members TEXT,
        total TEXT,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , payment_status TEXT DEFAULT 'Paid', recieved_by TEXT DEFAULT 'Online');

-- Dumping data for table `visitors`
INSERT INTO `visitors` (`id`, `name`, `address`, `age`, `gender`, `resort`, `visitor_type`, `duration`, `members`, `total`, `status`, `created_at`, `payment_status`, `recieved_by`) VALUES ('TIB-2026-8465', 'Ana Reyes', 'Quezon City', 30, 'Female', 'BlueWave', 'Domestic National', 'Overnight', '[]', '₱50.00', 'Active', '2026-05-22 23:12:46', 'Paid', 'Julia Dela Cruz');
INSERT INTO `visitors` (`id`, `name`, `address`, `age`, `gender`, `resort`, `visitor_type`, `duration`, `members`, `total`, `status`, `created_at`, `payment_status`, `recieved_by`) VALUES ('TIB-2026-4847', 'Tony Davo', 'Tibiao Antique', 60, 'Male', 'BlueWave', 'Domestic Local', 'Same Day', '[]', '₱16.00', 'Active', '2026-05-22 23:32:15', 'Paid', 'John Delos Reyes');
INSERT INTO `visitors` (`id`, `name`, `address`, `age`, `gender`, `resort`, `visitor_type`, `duration`, `members`, `total`, `status`, `created_at`, `payment_status`, `recieved_by`) VALUES ('TIB-2026-7477', 'Antonio Davao Jr', 'Culasi, Antique', 28, 'Male', 'Campolly', 'Domestic Local', 'Same Day', '[]', '₱20.00', 'Active', '2026-05-23 02:20:22', 'Paid', 'Julia Dela Cruz');

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        level TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `username`, `password`, `role`, `level`, `created_at`) VALUES (1, 'Juan Dela Cruz', 'password123', 'Administrator', 'admin', '2026-03-01 00:58:08');
INSERT INTO `users` (`id`, `username`, `password`, `role`, `level`, `created_at`) VALUES (3, 'Julia Dela Cruz', 'password123', 'Staff 1', 'staff', '2026-03-06 03:23:06');
INSERT INTO `users` (`id`, `username`, `password`, `role`, `level`, `created_at`) VALUES (4, 'John Delos Reyes', 'password123', 'Staff 2', 'staff', '2026-05-22 23:22:48');

-- Table structure for table `attendance`
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE "attendance" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            time_in DATETIME DEFAULT CURRENT_TIMESTAMP,
            time_out DATETIME,
            status TEXT DEFAULT 'IN',
            date DATE DEFAULT (DATE('now')),
            remarks TEXT,
            break_start DATETIME,
            total_break_time INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

-- Dumping data for table `attendance`
INSERT INTO `attendance` (`id`, `user_id`, `username`, `time_in`, `time_out`, `status`, `date`, `remarks`, `break_start`, `total_break_time`) VALUES (7, 4, 'John Delos Reyes', '2026-05-22 23:23:59', NULL, 'IN', '2026-05-22', '', NULL, 0);

-- Table structure for table `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

-- Dumping data for table `settings`
INSERT INTO `settings` (`key`, `value`) VALUES ('statuses', '[{"value":"Regular","discount":0},{"value":"PWD","discount":0.2},{"value":"Senior Citizen","discount":0.2}]');
INSERT INTO `settings` (`key`, `value`) VALUES ('visitor_types', '[{"value":"Domestic Local","fee":20},{"value":"Domestic National","fee":50},{"value":"Foreigner","fee":50}]');
INSERT INTO `settings` (`key`, `value`) VALUES ('durations', '["Same Day","Overnight","2-3 Days","Week Long"]');
INSERT INTO `settings` (`key`, `value`) VALUES ('resorts', '["Calawag","BlueWave","Campolly","La Escapo"]');

COMMIT;
