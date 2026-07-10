CREATE TABLE IF NOT EXISTS Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL 
);

CREATE TABLE IF NOT EXISTS SystemUser (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Branch (
    branch_id SERIAL PRIMARY KEY,
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT
);

CREATE TABLE IF NOT EXISTS Employee (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    national_id CHAR(10) UNIQUE NOT NULL,
    branch_id INT NOT NULL,
    user_id INT UNIQUE,
    CONSTRAINT fk_emp_branch FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES SystemUser(user_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS Customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    national_id CHAR(10) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AccountType (
    account_type_id SERIAL PRIMARY KEY,
    title VARCHAR(50) UNIQUE NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS Account (
    account_id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    account_type_id INT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance_positive CHECK (balance >= 0),
    CONSTRAINT fk_acc_customer FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_acc_branch FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE RESTRICT,
    CONSTRAINT fk_acc_type FOREIGN KEY (account_type_id) REFERENCES AccountType(account_type_id) ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS TransactionType (
    transaction_type_id SERIAL PRIMARY KEY,
    title VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Transaction (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    transaction_type_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    destination_account_id INT,
    description TEXT,
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT fk_trans_account FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE RESTRICT,
    CONSTRAINT fk_trans_type FOREIGN KEY (transaction_type_id) REFERENCES TransactionType(transaction_type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_trans_dest_account FOREIGN KEY (destination_account_id) REFERENCES Account(account_id) ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS Loan (
    loan_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Paid_off', 'Defaulted')),
    CONSTRAINT chk_loan_amount CHECK (total_amount > 0),
    CONSTRAINT fk_loan_account FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Installment (
    installment_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue')),
    CONSTRAINT fk_inst_loan FOREIGN KEY (loan_id) REFERENCES Loan(loan_id) ON DELETE CASCADE
);