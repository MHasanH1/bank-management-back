CREATE OR REPLACE VIEW vw_customer_accounts AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS full_name,
    c.national_id,
    a.account_number,
    a.balance,
    at.title AS account_type,
    b.branch_name,
    a.status
FROM Customer c
JOIN Account a ON c.customer_id = a.customer_id
JOIN AccountType at ON a.account_type_id = at.account_type_id
JOIN Branch b ON a.branch_id = b.branch_id;

CREATE OR REPLACE VIEW vw_customer_loans AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.national_id,
    a.account_number,
    l.loan_id,
    l.total_amount AS loan_amount,
    l.interest_rate,
    l.status AS loan_status,
    l.start_date,
    l.end_date
FROM Loan l
JOIN Account a ON l.account_id = a.account_id
JOIN Customer c ON a.customer_id = c.customer_id;

CREATE OR REPLACE VIEW vw_employee_details AS
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.national_id,
    b.branch_name,
    b.branch_code,
    b.city AS branch_city,
    u.username AS system_username,
    r.role_name
FROM Employee e
JOIN Branch b ON e.branch_id = b.branch_id
LEFT JOIN SystemUser u ON e.user_id = u.user_id
LEFT JOIN Roles r ON u.role_id = r.role_id;