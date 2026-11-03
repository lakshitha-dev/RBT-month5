# Offline Milestones (before Month 6)

| # | Milestone | Status | Starting point in this repo |
|---|-----------|--------|-----------------------------|
| 1 | Set up Kubernetes cluster and migrate app | ☐ | Images are already 12-factor (config via env, stdout logs, liveness/readiness endpoints, graceful SIGTERM) → map directly to a `Deployment` with `livenessProbe: /health/live`, `readinessProbe: /health/ready`. Try kind/minikube locally, then AKS/EKS/GKE. |
| 2 | Auto-scaling and load balancing | ☐ | API is stateless (JWT, no sessions) → HPA on CPU or on `http_requests_total` rate via prometheus-adapter. `scripts/load-test.mjs` (raise `CONCURRENCY`) to trigger scaling. Migrations already use an advisory lock, so multiple replicas are safe. |
| 3 | Security scanning in CI/CD (SAST/DAST) | ◐ | Trivy image scan runs (non-blocking). Next: CodeQL for SAST, `npm audit --audit-level=high`, OWASP ZAP baseline against the deployed URL, make CRITICAL findings blocking. |
| 4 | Disaster recovery plan + test | ☐ | Document RPO/RTO; scheduled `pg_dump` to object storage (Neon also gives point-in-time restore within its history window, and branches for restore drills); practise restore into a fresh DB and redeploy from an immutable `sha-` image. |
| 5 | Azure / AWS certification course | ☐ | AZ-900 → AZ-104 or AWS Cloud Practitioner → SAA. |
| 6 | Blue-green deployment | ◐ | Container Apps revisions give managed blue-green (multiple-revision mode + traffic split / labels). To do it explicitly: two compose/K8s stacks (`blue`, `green`) behind nginx/Ingress, switch the upstream after the new colour passes `/health/ready`, keep the old colour for instant rollback. |

## Ideas to note for Month 6

- Preview environment per pull request
- Distributed tracing (OpenTelemetry → Tempo) correlated with `requestId`
- SLOs on availability and p95 latency with burn-rate alerts
