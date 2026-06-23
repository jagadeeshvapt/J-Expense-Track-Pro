// Premium Expense Tracker Mock Data
// Pre-populated data for immediate visual impact and testing

const INITIAL_BUDGETS = {
  office: 5000,
  home: 3000,
  personal: 2000
};

const CATEGORIES = {
  office: ['SaaS & Software', 'Office Rent', 'Utilities', 'Travel & Fuel', 'Office Supplies', 'Client Entertainment', 'Marketing', 'Miscellaneous'],
  home: ['Rent/Mortgage', 'Groceries', 'Electricity & Gas', 'Water & Trash', 'Home Maintenance', 'Internet & TV', 'Home Insurance', 'Miscellaneous'],
  personal: ['Dining Out', 'Shopping', 'Hobbies & Leisure', 'Healthcare & Gym', 'Education', 'Transport', 'Gifts & Donations', 'Miscellaneous']
};

const INITIAL_TRANSACTIONS = [
  // Office Expenses
  {
    id: "off-1",
    type: "office",
    category: "SaaS & Software",
    amount: 150.00,
    date: "2026-06-01",
    description: "Monthly AWS Hosting fees",
    paymentMethod: "Card",
    tags: ["infrastructure", "recurring"]
  },
  {
    id: "off-2",
    type: "office",
    category: "Office Rent",
    amount: 2500.00,
    date: "2026-06-01",
    description: "June Office Rent",
    paymentMethod: "Bank Transfer",
    tags: ["fixed"]
  },
  {
    id: "off-3",
    type: "office",
    category: "Client Entertainment",
    amount: 280.50,
    date: "2026-06-05",
    description: "Dinner with Acme Corp VP",
    paymentMethod: "Card",
    tags: ["client", "sales"]
  },
  {
    id: "off-4",
    type: "office",
    category: "Office Supplies",
    amount: 85.20,
    date: "2026-06-10",
    description: "Ergonomic keyboard and notebooks",
    paymentMethod: "UPI",
    tags: ["assets"]
  },
  {
    id: "off-5",
    type: "office",
    category: "Travel & Fuel",
    amount: 120.00,
    date: "2026-06-12",
    description: "Fuel for company vehicle",
    paymentMethod: "Card",
    tags: ["travel"]
  },
  {
    id: "off-6",
    type: "office",
    category: "Marketing",
    amount: 450.00,
    date: "2026-06-15",
    description: "Google Ads campaign - June",
    paymentMethod: "Bank Transfer",
    tags: ["growth"]
  },
  {
    id: "off-7",
    type: "office",
    category: "SaaS & Software",
    amount: 79.99,
    date: "2026-06-18",
    description: "Slack Premium subscription",
    paymentMethod: "Card",
    tags: ["communication", "recurring"]
  },

  // Home Expenses
  {
    id: "home-1",
    type: "home",
    category: "Rent/Mortgage",
    amount: 1200.00,
    date: "2026-06-01",
    description: "June Apartment Rent",
    paymentMethod: "Bank Transfer",
    tags: ["fixed"]
  },
  {
    id: "home-2",
    type: "home",
    category: "Groceries",
    amount: 184.30,
    date: "2026-06-03",
    description: "Weekly organic groceries - WholeFoods",
    paymentMethod: "Card",
    tags: ["essential"]
  },
  {
    id: "home-3",
    type: "home",
    category: "Internet & TV",
    amount: 89.99,
    date: "2026-06-04",
    description: "Fiber Broadband subscription",
    paymentMethod: "UPI",
    tags: ["recurring"]
  },
  {
    id: "home-4",
    type: "home",
    category: "Electricity & Gas",
    amount: 145.50,
    date: "2026-06-08",
    description: "Electricity bill - May usage",
    paymentMethod: "Bank Transfer",
    tags: ["utility"]
  },
  {
    id: "home-5",
    type: "home",
    category: "Groceries",
    amount: 95.10,
    date: "2026-06-11",
    description: "Vegetables and pantry essentials",
    paymentMethod: "Cash",
    tags: ["essential"]
  },
  {
    id: "home-6",
    type: "home",
    category: "Home Maintenance",
    amount: 320.00,
    date: "2026-06-14",
    description: "AC repair and servicing",
    paymentMethod: "UPI",
    tags: ["unexpected"]
  },
  {
    id: "home-7",
    type: "home",
    category: "Water & Trash",
    amount: 55.00,
    date: "2026-06-19",
    description: "Water and waste management bill",
    paymentMethod: "Card",
    tags: ["utility"]
  },

  // Personal Expenses
  {
    id: "pers-1",
    type: "personal",
    category: "Dining Out",
    amount: 65.00,
    date: "2026-06-02",
    description: "Sushi dinner with friends",
    paymentMethod: "UPI",
    tags: ["social"]
  },
  {
    id: "pers-2",
    type: "personal",
    category: "Shopping",
    amount: 110.00,
    date: "2026-06-05",
    description: "Running shoes from Nike",
    paymentMethod: "Card",
    tags: ["fitness"]
  },
  {
    id: "pers-3",
    type: "personal",
    category: "Healthcare & Gym",
    amount: 60.00,
    date: "2026-06-06",
    description: "Monthly Gym Membership",
    paymentMethod: "Card",
    tags: ["fitness", "recurring"]
  },
  {
    id: "pers-4",
    type: "personal",
    category: "Dining Out",
    amount: 12.50,
    date: "2026-06-09",
    description: "Specialty coffee and croissant",
    paymentMethod: "Cash",
    tags: ["leisure"]
  },
  {
    id: "pers-5",
    type: "personal",
    category: "Hobbies & Leisure",
    amount: 15.00,
    date: "2026-06-12",
    description: "Movie night ticket",
    paymentMethod: "UPI",
    tags: ["entertainment"]
  },
  {
    id: "pers-6",
    type: "personal",
    category: "Education",
    amount: 299.00,
    date: "2026-06-15",
    description: "Online AI/ML course certificate",
    paymentMethod: "Card",
    tags: ["learning"]
  },
  {
    id: "pers-7",
    type: "personal",
    category: "Transport",
    amount: 45.00,
    date: "2026-06-17",
    description: "Uber rides - weekend out",
    paymentMethod: "Card",
    tags: ["travel"]
  },
  {
    id: "pers-8",
    type: "personal",
    category: "Dining Out",
    amount: 88.00,
    date: "2026-06-20",
    description: "Sunday brunch with family",
    paymentMethod: "Card",
    tags: ["family"]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INITIAL_BUDGETS, CATEGORIES, INITIAL_TRANSACTIONS };
}
