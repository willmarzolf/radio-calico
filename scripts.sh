#!/bin/bash
# Radio Calico - Unix Shell Scripts
# Alternative to Makefile for systems without make

# Colors
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

case "$1" in
    "help"|"")
        echo -e "${CYAN}Radio Calico - Available Commands${RESET}"
        echo ""
        echo -e "${GREEN}Development:${RESET}"
        echo "  ./scripts.sh dev        - Start development server"
        echo "  ./scripts.sh dev-docker - Start development with Docker"
        echo "  ./scripts.sh install    - Install dependencies"
        echo ""
        echo -e "${GREEN}Production:${RESET}"
        echo "  ./scripts.sh prod       - Start production environment"
        echo "  ./scripts.sh prod-build - Build production images"
        echo "  ./scripts.sh prod-up    - Start production containers"
        echo "  ./scripts.sh prod-down  - Stop production containers"
        echo ""
        echo -e "${GREEN}Testing:${RESET}"
        echo "  ./scripts.sh test         - Run all tests"
        echo "  ./scripts.sh test-backend - Run backend tests only"
        echo "  ./scripts.sh test-frontend - Run frontend tests only"
        echo "  ./scripts.sh test-coverage - Generate coverage report"
        echo ""
        echo -e "${GREEN}Management:${RESET}"
        echo "  ./scripts.sh status - Show container status"
        echo "  ./scripts.sh logs   - Show container logs"
        echo "  ./scripts.sh stop   - Stop all containers"
        echo "  ./scripts.sh clean  - Clean up Docker resources"
        ;;
    "install")
        echo -e "${CYAN}Installing dependencies...${RESET}"
        npm install
        echo -e "${GREEN}Dependencies installed${RESET}"
        ;;
    "dev")
        echo -e "${CYAN}Starting development server...${RESET}"
        npm run dev
        ;;
    "dev-docker")
        echo -e "${CYAN}Starting development with Docker...${RESET}"
        docker-compose up
        ;;
    "prod-build")
        echo -e "${CYAN}Building production images...${RESET}"
        docker-compose -f docker-compose.prod.yml build
        echo -e "${GREEN}Production images built${RESET}"
        ;;
    "prod-up")
        echo -e "${CYAN}Starting production environment...${RESET}"
        docker-compose -f docker-compose.prod.yml up -d
        echo -e "${GREEN}Production started at http://localhost${RESET}"
        ;;
    "prod-down")
        echo -e "${CYAN}Stopping production environment...${RESET}"
        docker-compose -f docker-compose.prod.yml down
        echo -e "${GREEN}Production stopped${RESET}"
        ;;
    "prod")
        ./scripts.sh prod-build
        ./scripts.sh prod-up
        ;;
    "test")
        echo -e "${CYAN}Running all tests...${RESET}"
        npm test
        ;;
    "test-backend")
        echo -e "${CYAN}Running backend tests...${RESET}"
        npm run test:backend
        ;;
    "test-frontend")
        echo -e "${CYAN}Running frontend tests...${RESET}"
        npm run test:frontend
        ;;
    "test-coverage")
        echo -e "${CYAN}Generating test coverage...${RESET}"
        npm run test:coverage
        ;;
    "status")
        echo -e "${CYAN}Container Status:${RESET}"
        docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo -e "${YELLOW}Production not running${RESET}"
        docker-compose ps 2>/dev/null || echo -e "${YELLOW}Development not running${RESET}"
        ;;
    "logs")
        echo -e "${CYAN}Production logs:${RESET}"
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "stop")
        echo -e "${CYAN}Stopping all containers...${RESET}"
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        docker-compose down 2>/dev/null || true
        echo -e "${GREEN}All containers stopped${RESET}"
        ;;
    "clean")
        echo -e "${CYAN}Cleaning up Docker resources...${RESET}"
        docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
        docker-compose down -v 2>/dev/null || true
        docker image prune -f
        docker volume prune -f
        echo -e "${GREEN}Cleanup completed${RESET}"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${RESET}"
        ./scripts.sh help
        ;;
esac