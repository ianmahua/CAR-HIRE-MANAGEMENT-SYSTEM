// Email to Role Mapping Configuration
// This file maps emails to roles for automatic role assignment

module.exports = {
  // Exact email matches
  exact: {
    'iannjosh123@gmail.com': 'Admin'
  },
  
  // Domain-based mappings (e.g., all @company.com are Directors)
  domains: {
    // 'company.com': 'Director'
  },
  
  // Pattern-based mappings (regex patterns)
  patterns: [
    // { pattern: /^admin@/, role: 'Admin' }
  ],
  
  // Function to get role from email
  getRoleFromEmail: function(email) {
    if (!email) return null;
    
    const lowerEmail = email.toLowerCase();
    
    // Check exact matches
    if (this.exact[lowerEmail]) {
      return this.exact[lowerEmail];
    }
    
    // Check domain matches
    const domain = lowerEmail.split('@')[1];
    if (domain && this.domains[domain]) {
      return this.domains[domain];
    }
    
    // Check pattern matches
    for (const { pattern, role } of this.patterns) {
      if (pattern.test(lowerEmail)) {
        return role;
      }
    }
    
    return null; // No mapping found
  }
};




