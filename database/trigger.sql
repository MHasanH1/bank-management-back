CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    type_title VARCHAR(50);
BEGIN
    SELECT title INTO type_title FROM TransactionType WHERE transaction_type_id = NEW.transaction_type_id;

    IF type_title = 'Deposit' THEN
        UPDATE Account SET balance = balance + NEW.amount WHERE account_id = NEW.account_id;
        
    ELSIF type_title = 'Withdrawal' THEN
        UPDATE Account SET balance = balance - NEW.amount WHERE account_id = NEW.account_id;
        
    ELSIF type_title = 'Transfer' THEN
        UPDATE Account SET balance = balance - NEW.amount WHERE account_id = NEW.account_id;
        UPDATE Account SET balance = balance + NEW.amount WHERE account_id = NEW.destination_account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_balance ON Transaction;

CREATE TRIGGER trigger_update_balance
AFTER INSERT ON Transaction
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();