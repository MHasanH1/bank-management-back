CREATE OR REPLACE PROCEDURE sp_execute_transfer(
    p_source_account_id INT,
    p_dest_account_id INT,
    p_amount DECIMAL(15,2),
    p_description TEXT,
    OUT p_transaction_id INT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_transfer_type_id INT;
BEGIN
    SELECT transaction_type_id INTO v_transfer_type_id 
    FROM TransactionType WHERE title = 'Transfer';

    INSERT INTO Transaction (account_id, transaction_type_id, amount, destination_account_id, description)
    VALUES (p_source_account_id, v_transfer_type_id, p_amount, p_dest_account_id, p_description)
    RETURNING transaction_id INTO p_transaction_id;
END;
$$;