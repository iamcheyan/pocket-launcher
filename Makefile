.PHONY: build test dev backend frontend test-backend test-frontend test-api screenshots perf clean

FRONTEND := apps/pocket-launcher/frontend
BACKEND := apps/pocket-launcher/backend/launcherd

build: backend frontend

backend:
	cd $(BACKEND) && go build ./...

frontend:
	cd $(FRONTEND) && npm ci --no-audit --no-fund && npm run build

# One command covers Go unit/integration, i18n key parity, typecheck, production
# build and a real-browser interaction pass against a freshly started launcherd.
test: test-backend test-frontend test-api

test-backend:
	cd $(BACKEND) && go vet ./... && go test ./...

test-api:
	bash apps/pocket-launcher/tests/api-contract.sh

test-frontend:
	cd $(FRONTEND) && npm ci --no-audit --no-fund
	cd $(FRONTEND) && npm run i18n
	cd $(FRONTEND) && npm run typecheck
	cd $(FRONTEND) && npm run build
	cd $(FRONTEND) && npm run smoke

dev:
	@mkdir -p .tmp
	@trap 'kill 0' EXIT; \
	(cd $(BACKEND) && LAUNCHER_DB=$(CURDIR)/.tmp/dev.sqlite LAUNCHER_ADDR=127.0.0.1:18788 go run .) & \
	(cd $(FRONTEND) && npm run dev)

screenshots:
	cd $(FRONTEND) && npm run screenshots

perf:
	cd $(FRONTEND) && npm run perf

clean:
	rm -rf .tmp $(FRONTEND)/dist
