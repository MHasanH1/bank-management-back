INSERT INTO Roles (role_name) VALUES 
('Administrator'),
('Employee') ON CONFLICT (role_name) DO NOTHING;

INSERT INTO AccountType (title, interest_rate) VALUES 
('حساب جاری', 0.00),
('سپرده پس‌انداز', 5.00),
('سپرده کوتاه‌مدت', 15.00) ON CONFLICT (title) DO NOTHING;

INSERT INTO TransactionType (title) VALUES 
('Deposit'),    
('Withdrawal'),
('Transfer') ON CONFLICT (title) DO NOTHING;

INSERT INTO Branch (branch_code, branch_name, city, address) VALUES 
('BR-1001', 'شعبه مرکزی', 'تهران', 'خیابان اصلی، پلاک ۱') ON CONFLICT (branch_code) DO NOTHING;

INSERT INTO SystemUser (username, password_hash, role_id) 
VALUES (
    'admin', 
    '$2b$10$P.HIsesjHxgghsFrjvE0Q.HOCM496BLjBW0xMfi9z3vMTReINWAxq', 
    (SELECT role_id FROM Roles WHERE role_name = 'Administrator')
) ON CONFLICT (username) DO NOTHING;

INSERT INTO Employee (first_name, last_name, national_id, branch_id, user_id) 
VALUES (
    'admin', 
    'manager', 
    '0000000000',
    (SELECT branch_id FROM Branch WHERE branch_code = 'BR-1001'), 
    (SELECT user_id FROM SystemUser WHERE username = 'admin')
) ON CONFLICT (national_id) DO NOTHING;