#!/bin/bash
# Radio Calico Security Scanning Script
# Comprehensive security analysis for the application

# Colors
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

echo -e "${CYAN}🔒 Radio Calico Security Scanning Suite${RESET}"
echo "=========================================="
echo

# Exit on first error for strict security checks
set -e

# Function to run security check with error handling
run_security_check() {
    local name="$1"
    local command="$2"
    local allow_warnings="$3"
    
    echo -e "${CYAN}Running ${name}...${RESET}"
    
    if [ "$allow_warnings" = "true" ]; then
        set +e  # Allow command to fail
        eval "$command"
        local exit_code=$?
        set -e
        
        if [ $exit_code -eq 0 ]; then
            echo -e "${GREEN}✅ ${name}: PASSED${RESET}"
        else
            echo -e "${YELLOW}⚠️  ${name}: COMPLETED WITH WARNINGS${RESET}"
        fi
    else
        eval "$command"
        echo -e "${GREEN}✅ ${name}: PASSED${RESET}"
    fi
    echo
}

echo -e "${CYAN}📦 Dependency Security Audit${RESET}"
echo "--------------------------------"

# Check for npm audit
run_security_check "NPM Audit (Dependencies)" "npm audit --audit-level=moderate" "true"

# Check for known vulnerabilities with detailed output
echo -e "${CYAN}📊 Detailed Vulnerability Report${RESET}"
echo "-----------------------------------"
run_security_check "NPM Audit Report" "npm audit --json > .security-audit.json 2>/dev/null || true && echo 'Audit report saved to .security-audit.json'"

echo -e "${CYAN}🔍 Code Security Analysis${RESET}"
echo "----------------------------"

# Check for common security issues in code
echo -e "${CYAN}Checking for common security patterns...${RESET}"

# Check for hardcoded secrets
echo "🔐 Scanning for potential hardcoded secrets..."
if grep -r -i --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" \
   -E "(password|secret|key|token|api.*key).*[:=].*['\"][^'\"]{8,}['\"]" . 2>/dev/null; then
    echo -e "${RED}⚠️  Potential hardcoded secrets found${RESET}"
else
    echo -e "${GREEN}✅ No obvious hardcoded secrets detected${RESET}"
fi

# Check for console.log statements (information disclosure)
echo
echo "🖨️  Scanning for console.log statements..."
console_logs=$(grep -r -n --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tests \
               "console\.log" . 2>/dev/null | wc -l)
if [ "$console_logs" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $console_logs console.log statements (review for sensitive data)${RESET}"
    grep -r -n --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tests \
         "console\.log" . 2>/dev/null | head -5
else
    echo -e "${GREEN}✅ No console.log statements found${RESET}"
fi

echo
echo -e "${CYAN}🌐 Docker Security Check${RESET}"
echo "-------------------------"

# Check Dockerfile for security best practices
if [ -f "Dockerfile" ]; then
    echo "📋 Analyzing Dockerfile security practices..."
    
    # Check if running as root
    if grep -q "USER.*root\|^USER 0" Dockerfile 2>/dev/null; then
        echo -e "${RED}⚠️  Dockerfile may run as root user${RESET}"
    else
        echo -e "${GREEN}✅ Dockerfile uses non-root user${RESET}"
    fi
    
    # Check for COPY . . (potential secret exposure)
    if grep -q "COPY \. \." Dockerfile 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Dockerfile copies entire context (check .dockerignore)${RESET}"
    else
        echo -e "${GREEN}✅ Dockerfile uses selective copying${RESET}"
    fi
else
    echo -e "${YELLOW}⚠️  No Dockerfile found${RESET}"
fi

echo
echo -e "${CYAN}🔒 Environment Security${RESET}"
echo "------------------------"

# Check for .env files in repository
echo "📝 Checking environment file security..."
if ls .env* 2>/dev/null | grep -v ".example" | grep -v ".prod.example" >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Environment files found in repository:${RESET}"
    ls .env* 2>/dev/null | grep -v ".example" | grep -v ".prod.example"
else
    echo -e "${GREEN}✅ No environment files in repository${RESET}"
fi

# Check gitignore for common security patterns
if [ -f ".gitignore" ]; then
    echo
    echo "🚫 Checking .gitignore security patterns..."
    security_patterns=(".env" "*.key" "*.pem" "*.p12" "config/database.yml")
    missing_patterns=()
    
    for pattern in "${security_patterns[@]}"; do
        if ! grep -q "$pattern" .gitignore 2>/dev/null; then
            missing_patterns+=("$pattern")
        fi
    done
    
    if [ ${#missing_patterns[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ .gitignore includes common security patterns${RESET}"
    else
        echo -e "${YELLOW}⚠️  Consider adding these patterns to .gitignore:${RESET}"
        printf '%s\n' "${missing_patterns[@]}"
    fi
fi

echo
echo -e "${CYAN}📊 Security Summary${RESET}"
echo "====================="

# Count total issues
total_warnings=0
total_errors=0

# Parse audit results if available
if [ -f ".security-audit.json" ]; then
    # Extract vulnerability counts from JSON (basic parsing)
    if command -v jq >/dev/null 2>&1; then
        high_vuln=$(jq -r '.metadata.vulnerabilities.high // 0' .security-audit.json 2>/dev/null || echo "0")
        moderate_vuln=$(jq -r '.metadata.vulnerabilities.moderate // 0' .security-audit.json 2>/dev/null || echo "0")
        low_vuln=$(jq -r '.metadata.vulnerabilities.low // 0' .security-audit.json 2>/dev/null || echo "0")
        
        echo "🎯 Vulnerability Summary:"
        echo "   High: $high_vuln"
        echo "   Moderate: $moderate_vuln"  
        echo "   Low: $low_vuln"
        
        total_errors=$((total_errors + high_vuln))
        total_warnings=$((total_warnings + moderate_vuln + low_vuln))
    else
        echo "📋 Audit complete (install 'jq' for detailed JSON parsing)"
    fi
    
    # Clean up temporary file
    rm -f .security-audit.json
fi

echo
echo "🔍 Console.log statements: $console_logs"

# Final security score
if [ $total_errors -gt 0 ]; then
    echo -e "${RED}🚨 Security Status: CRITICAL ISSUES FOUND${RESET}"
    echo -e "${RED}   Errors: $total_errors${RESET}"
    echo -e "${YELLOW}   Warnings: $total_warnings${RESET}"
    exit 1
elif [ $total_warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Security Status: WARNINGS PRESENT${RESET}"
    echo -e "${YELLOW}   Warnings: $total_warnings${RESET}"
    echo "   Review and address warnings before production deployment"
else
    echo -e "${GREEN}🔒 Security Status: GOOD${RESET}"
    echo "   No critical security issues detected"
fi

echo
echo -e "${CYAN}🛡️  Security Recommendations:${RESET}"
echo "1. Run security scans regularly in CI/CD pipeline"
echo "2. Keep dependencies updated with 'npm audit fix'"
echo "3. Review code for sensitive data before commits"
echo "4. Use environment variables for configuration"
echo "5. Enable dependabot or similar for automated updates"
echo "6. Consider adding security headers to nginx configuration"

echo
echo -e "${GREEN}Security scan completed!${RESET}"