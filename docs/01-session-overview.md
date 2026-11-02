# Month 5 Session — DevOps & Production Deployment

## Session Overview

| Attribute     | Details                                        |
|---------------|------------------------------------------------|
| Duration      | 4 hours                                        |
| Track         | Engineer                                       |
| Focus         | Docker, CI/CD, cloud deployment, monitoring    |
| Prerequisites | Month 4 completed, command line proficiency    |

## Learning Objectives

By the end of this session, participants will be able to:

- Containerize fullstack applications with Docker
- Create multi-container setups with Docker Compose
- Set up CI/CD pipelines with GitHub Actions
- Deploy applications to cloud platforms
- Configure monitoring and logging

## Session Agenda (4 Hours)

### Hour 1: Containerization Fundamentals (60 min)

**Docker Concepts (30 min)**
- Images vs containers
- Dockerfile best practices
- Multi-stage builds
- Layer caching optimization

**Docker Compose (30 min)**
- Service definitions
- Network configuration
- Volume management
- Environment variables

### Hours 2–3: Hands-on DevOps Work (120 min)

**Challenge: Deploy Fullstack Application**

Context:
- **Application:** Fullstack app from previous months
- **Components:** Frontend, Backend API, Database
- **Target:** Cloud deployment with CI/CD
- **Monitoring:** Basic observability setup

**Part 1: Containerization (30 min)**
1. Write Dockerfile for frontend (multi-stage)
2. Write Dockerfile for backend API
3. Create docker-compose.yml for all services
4. Configure networking between containers

**Part 2: CI/CD Pipeline (40 min)**

5. Set up GitHub Actions workflow
6. Add build and test steps
7. Add Docker build and push
8. Configure deployment triggers

**Part 3: Cloud Deployment (30 min)**

9. Set up cloud environment (Azure/AWS/GCP)
10. Deploy containers to cloud
11. Configure HTTPS with SSL
12. Set up database connection

**Part 4: Monitoring Setup (20 min)**

13. Configure logging aggregation
14. Set up basic metrics
15. Create monitoring dashboard
16. Configure alerting

### Hour 4: Review & Validation (60 min)

**Deployment Verification (30 min)**
- Test production deployment
- Verify all services running
- Check monitoring dashboard

**Pipeline Review (15 min)**
- Review CI/CD workflow
- Discuss improvements

**Session Retrospective (15 min)**
- Key learnings
- Questions for follow-up
- Preview of offline milestones

## Deliverables Checklist

| # | Deliverable          | Format             | Required |
|---|----------------------|--------------------|----------|
| 1 | Dockerfiles          | Docker files       | Yes      |
| 2 | docker-compose.yml   | YAML               | Yes      |
| 3 | CI/CD pipeline       | .github/workflows  | Yes      |
| 4 | Production URL       | Live deployment    | Yes      |
| 5 | Monitoring dashboard | Screenshot/URL     | Yes      |

## Offline Milestones (Before Month 6)

- [ ] Set up Kubernetes cluster and migrate app
- [ ] Implement auto-scaling and load balancing
- [ ] Add security scanning to CI/CD (SAST/DAST)
- [ ] Create disaster recovery plan and test it
- [ ] Complete Azure/AWS certification course
- [ ] Implement blue-green deployment

## Resources

### Required Reading
- Docker Documentation: https://docs.docker.com/
- GitHub Actions: https://docs.github.com/en/actions
- 12-Factor App: https://12factor.net/

### Tools
- Docker Desktop
- GitHub Actions
- Cloud CLI (aws / gcloud / az)
- Datadog / New Relic (monitoring)

### Session Video
- https://youtu.be/cO73iYujw4g — see [03-video-notes.md](03-video-notes.md)

## Assessment Criteria

| Category         | Weight | Max Points |
|------------------|--------|------------|
| Containerization | 25%    | 25         |
| CI/CD Pipeline   | 25%    | 25         |
| Cloud Deployment | 25%    | 25         |
| Monitoring       | 15%    | 15         |
| Documentation    | 10%    | 10         |
| **Total**        | 100%   | **100**    |
