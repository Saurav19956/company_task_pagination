const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

app.use(bodyParser.json());

let customers = JSON.parse(fs.readFileSync('customers.json', 'utf8'));
//console.log(customers)
// Pagination helper function
const paginate = (array, page, limit) => {
  return array.slice((page - 1) * limit, page * limit);
};

// List all customers with optional search and pagination
app.get('/customers', (req, res) => {
  const { first_name, last_name, city, page = 1, limit = 10 } = req.query;

  let filteredCustomers = customers;

  if (first_name) {
    filteredCustomers = filteredCustomers.filter(c => 
      c.first_name.toLowerCase().includes(first_name.toLowerCase())
    );
  }

  if (last_name) {
    filteredCustomers = filteredCustomers.filter(c => 
      c.last_name.toLowerCase().includes(last_name.toLowerCase())
    );
  }

  if (city) {
    filteredCustomers = filteredCustomers.filter(c => 
      c.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  const paginatedCustomers = paginate(filteredCustomers, parseInt(page), parseInt(limit));
  res.json(paginatedCustomers);
});

// Get customer by ID
app.get('/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id === parseInt(req.params.id));
  if (!customer) {
    return res.status(404).send('Customer not found');
  }
  res.json(customer);
});

// List all unique cities with customer count
app.get('/cities', (req, res) => {
  const cityCount = customers.reduce((acc, customer) => {
    acc[customer.city] = (acc[customer.city] || 0) + 1;
    return acc;
  }, {});

  const result = Object.keys(cityCount).map(city => ({
    city,
    customer_count: cityCount[city]
  }));

  res.json(result);
});

// Add new customer with validation
app.post('/customers', (req, res) => {
  const { first_name, last_name, city, company } = req.body;

  if (!first_name || !last_name || !city || !company) {
    return res.status(400).send('All fields are required: first_name, last_name, city, company');
  }

  const newCustomer = {
    id: customers.length + 1,
    first_name,
    last_name,
    city,
    company
  };

  customers.push(newCustomer);
  fs.writeFileSync('customers.json', JSON.stringify(customers, null, 2));
  res.status(201).json(newCustomer);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
