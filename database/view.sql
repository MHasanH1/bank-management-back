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