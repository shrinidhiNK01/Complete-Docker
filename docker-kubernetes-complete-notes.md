# Docker and Kubernetes Complete Notes

Date: 2026-07-09

These notes are written from beginner to advanced level in simple English. They cover the full practical path:

- Why containers exist
- How Docker works
- How to build, run, debug, secure, and publish containers
- How Kubernetes works
- How to deploy real applications on Kubernetes
- How to debug, scale, secure, and operate Kubernetes systems
- How Docker and Kubernetes fit into real developer and production workflows

This is a study handbook, not only a command list. The aim is to build intuition first, then procedures, then production habits.

Official references used while preparing these notes:

- Docker Engine installation: https://docs.docker.com/engine/install/
- Docker container basics: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
- Dockerfile reference: https://docs.docker.com/reference/dockerfile/
- Docker Compose docs: https://docs.docker.com/compose/
- Kubernetes concepts: https://kubernetes.io/docs/concepts/
- Kubernetes workloads: https://kubernetes.io/docs/concepts/workloads/
- Kubernetes services and networking: https://kubernetes.io/docs/concepts/services-networking/
- Kubernetes storage: https://kubernetes.io/docs/concepts/storage/
- Kubernetes security: https://kubernetes.io/docs/concepts/security/
- kubeadm installation: https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/

---

## 1. Big Picture

### 1.1 The Old Problem

Before containers, developers often had this problem:

> "It works on my machine, but not on the server."

Why?

- The developer machine had one operating system version.
- The server had another operating system version.
- The app needed a specific language runtime.
- The app needed system libraries.
- Environment variables were missing.
- File paths were different.
- Database or network settings were different.

So deployment became painful.

### 1.2 The Container Idea

A container packages an application with the things it needs to run:

- Application code
- Runtime, such as Node.js, Python, Java, Go binary, or Nginx
- System libraries
- Default command
- Environment settings
- Filesystem layout

The container does not include a full guest operating system like a virtual machine. Instead, it shares the host operating system kernel and isolates the app using Linux features.

### 1.3 Container Intuition

Think of a normal process as:

```text
process + host filesystem + host network + host process list
```

Think of a container as:

```text
process + isolated filesystem + isolated network + isolated process view
```

The app is still a process. A container is not magic. It is a process with boundaries.

### 1.4 Docker vs Kubernetes

Docker helps you:

- Build container images.
- Run containers on one machine.
- Create networks and volumes.
- Define multi-container apps with Compose.
- Push and pull images from registries.

Kubernetes helps you:

- Run containers across many machines.
- Keep the desired number of app copies running.
- Restart failed apps.
- Expose apps through stable networking.
- Mount storage.
- Roll out new versions safely.
- Manage configuration and secrets.
- Scale apps.
- Coordinate production deployment.

Simple summary:

```text
Docker = package and run containers.
Kubernetes = orchestrate containers at scale.
```

---

## 2. Containers From First Principles

### 2.1 What Is a Process?

A process is a running program.

Examples:

- `node server.js`
- `python app.py`
- `nginx`
- `postgres`

A process needs:

- CPU time
- Memory
- Files
- Network access
- Environment variables
- Permissions

Containers control what the process can see and use.

### 2.2 Namespaces

Linux namespaces give a process its own view of the system.

Important namespaces:

| Namespace | What it isolates |
|---|---|
| PID | Process IDs |
| NET | Network interfaces, IPs, routing |
| MNT | Mounted filesystems |
| UTS | Hostname |
| IPC | Inter-process communication |
| USER | User and group IDs |
| CGROUP | Resource control view |

Intuition:

```text
Host process list:
  1 systemd
  812 docker
  910 containerd
  1550 node

Inside container:
  1 node
```

Inside the container, your app may appear to be process `1`, even though on the host it is a normal process with another PID.

### 2.3 cgroups

cgroups control resource usage.

They can limit:

- CPU
- Memory
- Disk I/O
- Process count
- Device access

Example:

```bash
docker run --memory=256m --cpus=0.5 nginx
```

Meaning:

- `--memory=256m`: the container can use up to 256 MB memory.
- `--cpus=0.5`: the container can use half of one CPU core.
- `nginx`: image to run.

### 2.4 Union Filesystems and Layers

Container images are built in layers.

Example Dockerfile:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
```

Each instruction creates or uses a layer:

```text
Layer 1: node:22-alpine base image
Layer 2: /app workdir metadata
Layer 3: package files copied
Layer 4: dependencies installed
Layer 5: app source copied
Layer 6: default command metadata
```

When a container starts, Docker adds a thin writable layer on top:

```text
container writable layer
app source layer
dependency layer
base OS layer
```

If the container writes files, those writes go into the writable layer unless a volume or bind mount is used.

---

## 3. Docker Architecture

### 3.1 Docker Components

```mermaid
flowchart LR
    User["User"] --> CLI["docker CLI"]
    CLI --> Daemon["Docker daemon"]
    Daemon --> Containerd["containerd"]
    Containerd --> Runtime["runc / OCI runtime"]
    Runtime --> Container["Container process"]
    Daemon --> Images["Images"]
    Daemon --> Volumes["Volumes"]
    Daemon --> Networks["Networks"]
    Daemon --> Registry["Image registry"]
```

Important pieces:

- Docker CLI: command-line tool, such as `docker run`.
- Docker daemon: background service that manages images, containers, networks, and volumes.
- containerd: lower-level container lifecycle manager.
- runc: low-level OCI runtime that starts containers using Linux primitives.
- Registry: image storage service, such as Docker Hub, GHCR, ECR, GCR, or a private registry.

### 3.2 Image vs Container

An image is a template.

A container is a running or stopped instance of an image.

```text
Image:      class / blueprint / recipe
Container: object / running instance / meal cooked from recipe
```

Example:

```bash
docker pull nginx
docker run --name web -p 8080:80 nginx
```

Line by line:

- `docker pull nginx`: downloads the `nginx` image.
- `docker run`: creates and starts a container.
- `--name web`: names the container `web`.
- `-p 8080:80`: maps host port `8080` to container port `80`.
- `nginx`: image used to create the container.

### 3.3 Docker Objects

Docker commonly manages:

- Images
- Containers
- Volumes
- Networks
- Build cache
- Contexts
- Plugins
- Secrets and configs in Swarm mode

Common inspection commands:

```bash
docker image ls
docker container ls
docker container ls -a
docker volume ls
docker network ls
docker system df
```

---

## 4. Installing Docker

### 4.1 Recommended Options

For beginners:

- Windows: Docker Desktop with WSL 2 backend.
- macOS: Docker Desktop.
- Linux workstation: Docker Engine or Docker Desktop for Linux.

For servers:

- Docker Engine from official repositories.
- Or use containerd directly when Kubernetes manages the node.

### 4.2 Verify Installation

```bash
docker version
docker info
docker run hello-world
```

Explanation:

- `docker version`: shows client and server versions.
- `docker info`: shows daemon configuration, storage driver, cgroup driver, runtimes, images, and containers.
- `docker run hello-world`: downloads and runs a test image.

### 4.3 Docker Contexts

Docker contexts let one CLI talk to different Docker endpoints.

```bash
docker context ls
docker context use default
```

Useful when you switch between local Docker, remote Docker, and cloud environments.

---

## 5. Running Containers

### 5.1 Basic Run

```bash
docker run nginx
```

This:

1. Looks for image `nginx` locally.
2. Pulls it if missing.
3. Creates a container.
4. Starts the container.
5. Attaches your terminal to container output.

### 5.2 Detached Mode

```bash
docker run -d --name web -p 8080:80 nginx
```

Line by line:

- `docker run`: create and start a container.
- `-d`: detached mode, run in background.
- `--name web`: assign name `web`.
- `-p 8080:80`: expose container port `80` on host port `8080`.
- `nginx`: image name.

Open:

```text
http://localhost:8080
```

### 5.3 Container Lifecycle

```bash
docker ps
docker ps -a
docker stop web
docker start web
docker restart web
docker rm web
```

Meaning:

- `docker ps`: running containers.
- `docker ps -a`: running and stopped containers.
- `docker stop`: gracefully stop.
- `docker start`: start existing stopped container.
- `docker restart`: stop then start.
- `docker rm`: delete stopped container.

### 5.4 Interactive Containers

```bash
docker run -it ubuntu bash
```

Line by line:

- `-i`: keep STDIN open.
- `-t`: allocate a pseudo-terminal.
- `ubuntu`: image.
- `bash`: command to run inside container.

### 5.5 Execute Commands in a Running Container

```bash
docker exec -it web sh
```

Meaning:

- `docker exec`: run a new command in an existing container.
- `-it`: interactive terminal.
- `web`: container name.
- `sh`: shell command.

### 5.6 Logs

```bash
docker logs web
docker logs -f web
docker logs --tail 100 web
```

Meaning:

- `docker logs web`: show logs.
- `-f`: follow logs.
- `--tail 100`: show last 100 lines.

### 5.7 Inspect

```bash
docker inspect web
```

Shows low-level JSON details:

- ID
- image
- command
- environment
- mounts
- network settings
- IP address
- restart policy
- health status

### 5.8 Copy Files

```bash
docker cp web:/etc/nginx/nginx.conf ./nginx.conf
docker cp ./index.html web:/usr/share/nginx/html/index.html
```

First command copies from container to host.

Second command copies from host to container.

For real development, prefer rebuilding the image or using bind mounts instead of manually copying files.

---

## 6. Docker Images

### 6.1 Image Naming

Full image name shape:

```text
registry/namespace/repository:tag
```

Examples:

```text
nginx:latest
node:22-alpine
docker.io/library/postgres:16
ghcr.io/my-org/my-api:1.3.0
```

Parts:

- `registry`: where image lives.
- `namespace`: user or organization.
- `repository`: image name.
- `tag`: human-readable version label.

### 6.2 Tags vs Digests

Tag:

```text
nginx:latest
```

A tag can move. Today it may point to one image digest; later it can point to another.

Digest:

```text
nginx@sha256:...
```

A digest is content-addressed and immutable.

Production rule:

- Use tags for development convenience.
- Use pinned versions or digests for reproducible production builds.

### 6.3 Pull, Tag, Push

```bash
docker pull nginx:1.27
docker tag nginx:1.27 my-registry.example.com/platform/nginx:1.27
docker push my-registry.example.com/platform/nginx:1.27
```

Line by line:

- Pull the image from a registry.
- Create another name pointing to the same local image.
- Push the renamed image to another registry.

---

## 7. Dockerfile Complete Practical Guide

### 7.1 What Is a Dockerfile?

A Dockerfile is a text file that tells Docker how to build an image.

Example:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

### 7.2 Line-by-Line Explanation

```dockerfile
FROM node:22-alpine
```

Use the official Node.js image based on Alpine Linux as the starting layer.

```dockerfile
WORKDIR /app
```

Set `/app` as the working directory for later commands.

```dockerfile
COPY package*.json ./
```

Copy `package.json` and maybe `package-lock.json` into the image.

```dockerfile
RUN npm ci --omit=dev
```

Install production dependencies exactly from the lock file.

```dockerfile
COPY . .
```

Copy the rest of the application source code into `/app`.

```dockerfile
ENV NODE_ENV=production
```

Set an environment variable inside the image.

```dockerfile
EXPOSE 3000
```

Document that the app listens on port `3000`. This does not publish the port by itself.

```dockerfile
USER node
```

Run the app as the non-root `node` user included in the image.

```dockerfile
CMD ["node", "server.js"]
```

Default command when a container starts from this image.

### 7.3 Important Dockerfile Instructions

#### FROM

```dockerfile
FROM python:3.12-slim
```

Sets the base image. Every normal Dockerfile starts with `FROM`, except special syntax/parser directives.

#### RUN

```dockerfile
RUN apt-get update && apt-get install -y curl
```

Runs a command while building the image. The result becomes part of the image layer.

Best practice:

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

Why:

- `apt-get update`: refresh package index.
- `apt-get install`: install package.
- `--no-install-recommends`: avoid unnecessary packages.
- `rm -rf /var/lib/apt/lists/*`: remove package index to reduce image size.

#### COPY

```dockerfile
COPY src/ ./src/
```

Copies files from build context into the image.

Prefer `COPY` for normal file copying.

#### ADD

```dockerfile
ADD app.tar.gz /app/
```

Like `COPY`, but can auto-extract local tar files and fetch remote URLs. Use only when you need those extra behaviors.

#### WORKDIR

```dockerfile
WORKDIR /app
```

Sets working directory. Better than repeatedly writing `cd /app`.

#### ENV

```dockerfile
ENV PORT=3000
```

Sets runtime environment variable baked into the image.

#### ARG

```dockerfile
ARG VERSION=dev
```

Build-time variable. Available during build, not automatically available at runtime.

Usage:

```bash
docker build --build-arg VERSION=1.2.0 -t myapp:1.2.0 .
```

#### EXPOSE

```dockerfile
EXPOSE 8080
```

Documents intended container port. You still need `-p` or a Compose/Kubernetes service to expose it.

#### CMD

```dockerfile
CMD ["node", "server.js"]
```

Default command. Can be overridden by arguments to `docker run`.

#### ENTRYPOINT

```dockerfile
ENTRYPOINT ["node"]
CMD ["server.js"]
```

`ENTRYPOINT` defines the main executable. `CMD` provides default arguments.

Container command becomes:

```text
node server.js
```

#### USER

```dockerfile
USER appuser
```

Run following commands and final container process as `appuser`.

Production best practice: do not run app containers as root unless truly required.

#### VOLUME

```dockerfile
VOLUME ["/data"]
```

Declares a mount point. In application images, it is often better to let Compose or Kubernetes define volumes explicitly.

#### HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1
```

Tells Docker how to check if the container is healthy.

#### LABEL

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/example/myapp"
```

Adds metadata to an image.

#### STOPSIGNAL

```dockerfile
STOPSIGNAL SIGTERM
```

Defines which signal Docker sends when stopping the container.

### 7.4 Build Context

When you run:

```bash
docker build -t myapp .
```

The final `.` means the current directory is the build context. Docker can only copy files from the build context.

Do not accidentally send huge directories into the build context.

Use `.dockerignore`.

Example `.dockerignore`:

```gitignore
node_modules
.git
.env
coverage
dist
*.log
```

Explanation:

- `node_modules`: install dependencies inside image instead.
- `.git`: source history is not needed in the image.
- `.env`: avoid baking secrets into image.
- `coverage`: test output not needed.
- `dist`: if build generates it inside image, do not copy host output.
- `*.log`: logs are runtime data, not image content.

### 7.5 Build Cache

Docker reuses previous layers when instructions and relevant files did not change.

Bad cache pattern:

```dockerfile
COPY . .
RUN npm ci
```

If any file changes, dependency install cache is invalidated.

Better pattern:

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

Now dependency install reruns only when package files change.

### 7.6 Multi-Stage Builds

Example for Go:

```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12
COPY --from=build /out/server /server
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/server"]
```

Line by line:

- `FROM golang:1.23 AS build`: start a builder stage with Go installed.
- `WORKDIR /src`: use `/src` as build directory.
- `COPY go.mod go.sum ./`: copy dependency metadata first.
- `RUN go mod download`: download modules.
- `COPY . .`: copy app source.
- `RUN CGO_ENABLED=0 go build ...`: compile static binary.
- `FROM gcr.io/distroless/static-debian12`: start small runtime image.
- `COPY --from=build /out/server /server`: copy only compiled binary from builder.
- `USER nonroot:nonroot`: avoid root.
- `EXPOSE 8080`: document port.
- `ENTRYPOINT ["/server"]`: run binary.

Why multi-stage builds matter:

- Smaller image.
- Fewer attack surfaces.
- Build tools stay out of runtime image.
- Cleaner production artifact.

### 7.7 BuildKit

BuildKit is Docker's modern build engine. It improves:

- Cache handling
- Parallel build execution
- Secrets during build
- SSH forwarding
- Multi-platform builds
- Exporting cache to registries

Example secret mount:

```dockerfile
# syntax=docker/dockerfile:1
FROM alpine
RUN --mount=type=secret,id=mytoken \
    TOKEN="$(cat /run/secrets/mytoken)" && echo "Using token safely"
```

Build:

```bash
docker build --secret id=mytoken,src=./token.txt .
```

The secret is available during that one build step and is not stored in the final image layer.

### 7.8 Multi-Platform Builds

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/example/myapp:1.0.0 \
  --push .
```

Meaning:

- `docker buildx build`: use extended builder.
- `--platform`: build for multiple CPU architectures.
- `-t`: image name and tag.
- `--push`: push result to registry.
- `.`: build context.

---

## 8. Docker Storage

### 8.1 Container Writable Layer

If a container writes to its filesystem without a mount, data goes into the container writable layer.

Problem:

- If the container is deleted, the data is deleted.
- Writable layers are not ideal for databases.
- Data is tied to container lifecycle.

Use volumes or bind mounts for persistent data.

### 8.2 Volumes

Create a volume:

```bash
docker volume create pgdata
```

Use it:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

Line by line:

- `docker run -d`: run in background.
- `--name postgres`: name container.
- `-e POSTGRES_PASSWORD=secret`: set required password environment variable.
- `-v pgdata:/var/lib/postgresql/data`: mount Docker volume into Postgres data path.
- `postgres:16`: image.

Volume lives even if the container is removed.

### 8.3 Bind Mounts

```bash
docker run -it --rm \
  -v "$PWD:/app" \
  -w /app \
  node:22-alpine \
  npm test
```

Meaning:

- Mount current host directory into `/app`.
- Set working directory to `/app`.
- Run tests in a Node container.

Bind mounts are great for development because code changes on the host appear inside the container.

### 8.4 tmpfs Mounts

```bash
docker run --tmpfs /tmp nginx
```

Stores files in memory, not on disk.

Useful for temporary sensitive files or fast scratch space.

### 8.5 Backup a Volume

```bash
docker run --rm \
  -v pgdata:/data \
  -v "$PWD:/backup" \
  alpine \
  tar czf /backup/pgdata.tar.gz -C /data .
```

Meaning:

- Mount `pgdata` at `/data`.
- Mount current host directory at `/backup`.
- Run `tar` to archive volume contents.

---

## 9. Docker Networking

### 9.1 Default Bridge Network

Docker creates a default bridge network.

Containers on the same user-defined bridge network can reach each other by container name.

Create network:

```bash
docker network create appnet
```

Run containers:

```bash
docker run -d --name db --network appnet postgres:16
docker run -d --name api --network appnet myapi:latest
```

Inside `api`, the hostname `db` resolves to the database container IP.

### 9.2 Port Publishing

```bash
docker run -p 8080:80 nginx
```

Shape:

```text
host_port:container_port
```

Meaning:

- Host listens on `localhost:8080`.
- Traffic forwards to container port `80`.

### 9.3 Network Drivers

| Driver | Use |
|---|---|
| bridge | Normal single-host containers |
| host | Container shares host network namespace |
| none | No network |
| overlay | Multi-host networking, used by Swarm |
| macvlan | Container appears as device on physical network |
| ipvlan | Similar to macvlan with different L2/L3 behavior |

### 9.4 DNS

On user-defined Docker networks, Docker provides internal DNS.

Example:

```yaml
services:
  api:
    image: myapi
  db:
    image: postgres:16
```

The `api` service can connect to hostname `db`.

### 9.5 Networking Debug Commands

```bash
docker network ls
docker network inspect appnet
docker exec -it api sh
```

Inside container:

```sh
getent hosts db
curl http://api:3000/health
ss -tulpen
```

---

## 10. Docker Compose

### 10.1 Why Compose Exists

Real apps usually need more than one container:

- Web app
- Database
- Cache
- Worker
- Message broker

Compose lets you define them in one YAML file.

### 10.2 Example Compose File

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://postgres:secret@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 10.3 Line-by-Line Explanation

```yaml
services:
```

Top-level section for containers Compose will manage.

```yaml
  api:
```

Defines a service named `api`.

```yaml
    build: .
```

Build the image from the Dockerfile in the current directory.

```yaml
    ports:
      - "3000:3000"
```

Publish host port `3000` to container port `3000`.

```yaml
    environment:
```

Set environment variables inside the container.

```yaml
      DATABASE_URL: postgres://postgres:secret@db:5432/app
```

The hostname `db` works because Compose creates a network and service DNS.

```yaml
    depends_on:
      - db
```

Start `db` before `api`. This does not guarantee the database is ready to accept connections. Your app should retry connections or use health checks.

```yaml
  db:
    image: postgres:16
```

Use the official Postgres image.

```yaml
    volumes:
      - pgdata:/var/lib/postgresql/data
```

Persist database files in named volume `pgdata`.

```yaml
volumes:
  pgdata:
```

Declare named volume.

### 10.4 Compose Commands

```bash
docker compose up
docker compose up -d
docker compose down
docker compose down -v
docker compose logs -f
docker compose ps
docker compose exec api sh
docker compose build
docker compose pull
```

Meaning:

- `up`: create and start services.
- `up -d`: start in background.
- `down`: stop and remove containers and network.
- `down -v`: also remove named volumes. Be careful with databases.
- `logs -f`: follow logs.
- `ps`: show service containers.
- `exec`: run command in service container.
- `build`: rebuild images.
- `pull`: pull service images.

### 10.5 Compose Profiles

Profiles let you start optional services.

```yaml
services:
  api:
    build: .

  adminer:
    image: adminer
    profiles:
      - debug
```

Run normal:

```bash
docker compose up
```

Run with debug tools:

```bash
docker compose --profile debug up
```

---

## 11. Container Registries

### 11.1 What Is a Registry?

A registry stores container images.

Examples:

- Docker Hub
- GitHub Container Registry
- Amazon Elastic Container Registry
- Google Artifact Registry
- Azure Container Registry
- Harbor
- GitLab Container Registry

### 11.2 Login

```bash
docker login ghcr.io
```

This stores credentials so Docker can push/pull private images.

### 11.3 Push Workflow

```bash
docker build -t ghcr.io/my-org/myapp:1.0.0 .
docker push ghcr.io/my-org/myapp:1.0.0
```

### 11.4 Image Promotion

A common production flow:

```text
Build once -> test image -> scan image -> tag for staging -> deploy -> tag for production -> deploy
```

Do not rebuild separately for each environment if you want strong reproducibility. Build once and promote the same image digest.

---

## 12. Docker Security

### 12.1 Main Security Idea

Containers are isolated processes, not full security boundaries like separate machines.

Security is layered:

- Minimal base images
- Non-root user
- Read-only filesystem where possible
- Drop Linux capabilities
- Resource limits
- Network restrictions
- Image scanning
- Secret management
- Runtime policies
- Host hardening

### 12.2 Do Not Run as Root

Dockerfile:

```dockerfile
RUN addgroup -S app && adduser -S app -G app
USER app
```

Meaning:

- Create group `app`.
- Create user `app`.
- Run final process as that user.

### 12.3 Drop Capabilities

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE nginx
```

Meaning:

- Drop all Linux capabilities.
- Add back only permission to bind low ports if needed.

### 12.4 Read-Only Filesystem

```bash
docker run --read-only --tmpfs /tmp nginx
```

Meaning:

- Container root filesystem cannot be written.
- `/tmp` is writable memory storage.

### 12.5 Docker Socket Risk

The Docker socket is powerful:

```text
/var/run/docker.sock
```

If a container can control the Docker socket, it can often control the host. Do not mount it casually.

Bad pattern:

```bash
docker run -v /var/run/docker.sock:/var/run/docker.sock some-tool
```

Use only when you fully trust the tool and understand the risk.

### 12.6 Secrets

Do not bake secrets into images.

Bad:

```dockerfile
ENV API_KEY=secret
```

Better:

- Runtime environment variable from secret manager
- Docker secret in Swarm
- Kubernetes Secret or external secret provider
- BuildKit secret mount for build-time private dependencies

### 12.7 Image Scanning

Scan for known vulnerabilities:

```bash
docker scout cves myapp:latest
trivy image myapp:latest
```

Security scanning does not prove safety. It reduces known risk.

---

## 13. Docker Operations and Debugging

### 13.1 Common Debug Flow

```bash
docker ps -a
docker logs <container>
docker inspect <container>
docker exec -it <container> sh
docker stats
docker events
```

Ask:

1. Is the container running?
2. Did it exit?
3. What do logs say?
4. Was the command correct?
5. Are environment variables present?
6. Can it reach dependencies?
7. Are ports published?
8. Are volumes mounted correctly?
9. Are permissions wrong?

### 13.2 Exit Codes

Common meanings:

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | General error |
| 125 | Docker daemon/CLI error |
| 126 | Command found but not executable |
| 127 | Command not found |
| 137 | Killed, often out of memory |
| 143 | Terminated by SIGTERM |

### 13.3 Prune Commands

```bash
docker container prune
docker image prune
docker volume prune
docker network prune
docker system prune
```

Be careful:

- `volume prune` can delete data.
- `system prune -a` can remove unused images you may need later.

---

## 14. Development Workflow With Docker

### 14.1 Recommended Local Loop

```text
edit code -> run tests in container -> run app with Compose -> inspect logs -> rebuild image -> repeat
```

### 14.2 Development Compose Example

```yaml
services:
  api:
    build:
      context: .
      target: dev
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      NODE_ENV: development

volumes:
  node_modules:
```

Why the `node_modules` volume?

If you mount `.:/app`, your host directory can hide `node_modules` installed in the image. A separate volume at `/app/node_modules` keeps container dependencies available.

### 14.3 CI Build Pattern

```yaml
name: container

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/my-org/myapp:${{ github.sha }}
```

Line by line:

- Trigger on push to `main`.
- Checkout code.
- Enable Buildx.
- Login to registry.
- Build and push image tagged with commit SHA.

---

## 15. Demo Application: Docker End to End

### 15.1 App Files

`package.json`

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.3",
    "pg": "^8.11.5"
  }
}
```

Explanation:

- `start`: production start command.
- `dev`: development command with auto-restart.
- `express`: web server framework.
- `pg`: PostgreSQL client.

`server.js`

```js
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", async (req, res) => {
  if (!pool) {
    res.json({ message: "Hello from Docker without database" });
    return;
  }

  const result = await pool.query("select now() as time");
  res.json({ message: "Hello from Docker", databaseTime: result.rows[0].time });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
```

Line by line:

- `const express = require("express");`: import Express.
- `const { Pool } = require("pg");`: import PostgreSQL connection pool.
- `const app = express();`: create web app.
- `const port = process.env.PORT || 3000;`: use `PORT` environment variable or default to `3000`.
- `const databaseUrl = process.env.DATABASE_URL;`: read database connection string.
- `const pool = ...`: create database pool only if URL exists.
- `/health`: lightweight health endpoint.
- `/`: main endpoint.
- `if (!pool)`: allow app to run without database.
- `pool.query("select now() as time")`: ask database for current time.
- `res.json(...)`: return JSON response.
- `app.listen(...)`: start HTTP server.

### 15.2 Production Dockerfile

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

Line by line:

- `FROM node:22-alpine AS deps`: builder stage for dependencies.
- `WORKDIR /app`: set working directory.
- `COPY package*.json ./`: copy dependency metadata.
- `RUN npm ci --omit=dev`: install production dependencies.
- `FROM node:22-alpine AS runtime`: clean runtime stage.
- `ENV NODE_ENV=production`: set production mode.
- `COPY --from=deps ...`: copy dependencies from previous stage.
- `COPY . .`: copy app source.
- `USER node`: run as non-root user.
- `EXPOSE 3000`: document app port.
- `CMD ["npm", "start"]`: start app.

### 15.3 Build and Run

```bash
docker build -t demo-api:1.0.0 .
docker run --rm -p 3000:3000 demo-api:1.0.0
```

Test:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/
```

### 15.4 Compose With Database

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      PORT: "3000"
      DATABASE_URL: postgres://postgres:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  pgdata:
```

Run:

```bash
docker compose up --build
```

---

## 16. Kubernetes Big Picture

### 16.1 Why Kubernetes Exists

Docker can run containers on one machine. Production usually needs more:

- Multiple servers
- Rolling deployments
- Self-healing
- Service discovery
- Load balancing
- Secrets
- Storage
- Scheduling
- Autoscaling
- Multi-environment deployments
- Declarative management

Kubernetes solves these orchestration problems.

### 16.2 Desired State

Kubernetes is declarative.

You say:

```text
I want 3 copies of this app running.
```

Kubernetes continuously tries to make reality match that desired state.

```mermaid
flowchart LR
    Manifest["YAML manifest"] --> APIServer["API Server"]
    APIServer --> Store["etcd stores desired state"]
    Controller["Controller loop"] --> APIServer
    Controller --> Reality["Actual cluster state"]
    Reality --> Controller
```

### 16.3 Kubernetes Cluster

A cluster has:

- Control plane nodes
- Worker nodes

Control plane manages the cluster.

Worker nodes run application workloads.

---

## 17. Kubernetes Architecture

### 17.1 Control Plane Components

```mermaid
flowchart TB
    User["kubectl / API client"] --> APIServer["kube-apiserver"]
    APIServer --> Etcd["etcd"]
    Scheduler["kube-scheduler"] --> APIServer
    ControllerManager["kube-controller-manager"] --> APIServer
    CloudController["cloud-controller-manager"] --> APIServer
```

#### kube-apiserver

The front door of Kubernetes.

Everything talks to the API server:

- `kubectl`
- controllers
- scheduler
- kubelets
- operators
- CI/CD tools

#### etcd

Distributed key-value database that stores cluster state.

It stores:

- Pods
- Deployments
- Services
- Secrets
- ConfigMaps
- Custom resources
- Cluster metadata

Production note: protect and back up etcd carefully.

#### kube-scheduler

Chooses which node should run a newly created Pod.

It considers:

- CPU and memory requests
- Node selectors
- Affinity
- Taints and tolerations
- Topology spread
- Storage constraints
- Policies

#### kube-controller-manager

Runs built-in controllers.

Examples:

- Deployment controller
- ReplicaSet controller
- Node controller
- Job controller
- EndpointSlice controller

A controller is a loop:

```text
observe current state -> compare desired state -> make changes
```

#### cloud-controller-manager

Integrates Kubernetes with cloud provider features:

- Load balancers
- Node metadata
- Routes
- Persistent disks

### 17.2 Worker Node Components

```mermaid
flowchart TB
    APIServer["API Server"] --> Kubelet["kubelet"]
    Kubelet --> Runtime["container runtime"]
    Runtime --> Pods["Pods"]
    KubeProxy["kube-proxy"] --> Network["Service networking"]
    CNI["CNI plugin"] --> Network
    CSI["CSI plugin"] --> Storage["Storage"]
```

#### kubelet

Agent running on every node. It:

- Watches assigned Pods.
- Starts containers through container runtime.
- Reports status to API server.
- Runs probes.
- Mounts volumes.

#### Container Runtime

Runs containers. Common runtime:

- containerd
- CRI-O

Kubernetes no longer needs Docker Engine on nodes. It talks through CRI, the Container Runtime Interface.

#### kube-proxy

Implements service networking rules on nodes. Depending on mode, it uses iptables, IPVS, or platform-specific networking.

#### CNI

Container Network Interface. Provides Pod networking.

Examples:

- Calico
- Cilium
- Flannel
- Weave Net
- cloud-provider CNI plugins

#### CSI

Container Storage Interface. Provides storage integration.

Examples:

- AWS EBS CSI
- GCE Persistent Disk CSI
- Azure Disk CSI
- Ceph CSI
- Longhorn

---

## 18. Kubernetes Objects

### 18.1 Manifest Shape

Most Kubernetes YAML looks like:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
  labels:
    app: demo-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-api
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      containers:
        - name: api
          image: ghcr.io/example/demo-api:1.0.0
          ports:
            - containerPort: 3000
```

Core fields:

- `apiVersion`: which API group/version handles this object.
- `kind`: type of object.
- `metadata`: name, namespace, labels, annotations.
- `spec`: desired state.
- `status`: current state, written by Kubernetes.

You normally write `spec`, not `status`.

### 18.2 Namespaces

Namespaces divide one cluster into logical areas.

```bash
kubectl create namespace dev
kubectl get pods -n dev
```

Common namespaces:

- `default`
- `kube-system`
- `kube-public`
- `kube-node-lease`
- app/team namespaces like `dev`, `staging`, `prod`

### 18.3 Labels

Labels are key-value pairs used for selection.

```yaml
metadata:
  labels:
    app: demo-api
    tier: backend
    environment: prod
```

Use labels for:

- Service selectors
- Deployment selectors
- NetworkPolicy selectors
- Organization and filtering

### 18.4 Annotations

Annotations are key-value metadata not usually used for selection.

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
```

Use annotations for:

- Tooling metadata
- Ingress controller config
- Prometheus scrape hints
- Build information

---

## 19. Pods

### 19.1 What Is a Pod?

A Pod is the smallest deployable unit in Kubernetes.

A Pod contains one or more containers that share:

- Network namespace
- IP address
- Volumes
- Lifecycle

Most Pods contain one main application container.

### 19.2 Pod Diagram

```mermaid
flowchart TB
    Pod["Pod: IP 10.1.2.3"] --> App["Container: app"]
    Pod --> Sidecar["Container: sidecar"]
    Pod --> Volume["Shared volume"]
    App --> Volume
    Sidecar --> Volume
```

### 19.3 Pod Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo-api
spec:
  containers:
    - name: api
      image: ghcr.io/example/demo-api:1.0.0
      ports:
        - containerPort: 3000
```

Line by line:

- `apiVersion: v1`: core Kubernetes API.
- `kind: Pod`: create a Pod.
- `metadata.name`: Pod name.
- `spec.containers`: list of containers in the Pod.
- `name: api`: container name.
- `image`: container image.
- `containerPort`: port the app listens on.

### 19.4 Do Not Usually Create Bare Pods

Bare Pods are not self-healing in the same way Deployments are.

Prefer:

- Deployment for stateless apps.
- StatefulSet for stateful replicated apps.
- DaemonSet for one Pod per node.
- Job/CronJob for batch work.

### 19.5 Init Containers

Init containers run before app containers.

```yaml
initContainers:
  - name: wait-for-db
    image: busybox
    command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
```

Use for setup tasks:

- Wait for dependency
- Run migrations carefully
- Generate config files
- Check permissions

### 19.6 Sidecars

A sidecar is a helper container in the same Pod.

Examples:

- Log shipper
- Service mesh proxy
- File sync helper
- Metrics exporter

Use sidecars when containers need tight lifecycle and local communication.

---

## 20. Kubernetes Workloads

### 20.1 ReplicaSet

A ReplicaSet ensures a number of identical Pods exist.

You rarely create ReplicaSets directly. Deployments manage them.

### 20.2 Deployment

Deployment is used for stateless apps.

It manages:

- ReplicaSets
- Rolling updates
- Rollbacks
- Scaling

Example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-api
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      containers:
        - name: api
          image: ghcr.io/example/demo-api:1.0.0
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
```

Important:

- `replicas: 3`: run 3 Pods.
- `selector.matchLabels`: which Pods this Deployment owns.
- `template`: Pod template.
- `readinessProbe`: decides if Pod should receive traffic.
- `livenessProbe`: decides if Pod should be restarted.
- `resources.requests`: what scheduler reserves.
- `resources.limits`: max allowed resources.

### 20.3 Rolling Update

When image changes from `1.0.0` to `1.1.0`, Deployment creates new Pods and removes old Pods gradually.

```bash
kubectl set image deployment/demo-api api=ghcr.io/example/demo-api:1.1.0
kubectl rollout status deployment/demo-api
```

Rollback:

```bash
kubectl rollout undo deployment/demo-api
```

### 20.4 StatefulSet

Use StatefulSet for apps needing stable identity or stable storage.

Examples:

- Databases
- Queues
- Consensus systems

Features:

- Stable Pod names like `postgres-0`, `postgres-1`
- Stable network identity
- Stable volume claim per Pod
- Ordered startup/shutdown

### 20.5 DaemonSet

DaemonSet runs one Pod on each selected node.

Examples:

- Log collector
- Node monitoring agent
- CNI plugin
- Storage daemon

### 20.6 Job

Job runs a task to completion.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: migrate-db
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: ghcr.io/example/demo-api:1.0.0
          command: ["npm", "run", "migrate"]
```

### 20.7 CronJob

CronJob runs Jobs on a schedule.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-cleanup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: cleanup
              image: ghcr.io/example/cleanup:1.0.0
```

Runs at 02:00 every day.

---

## 21. Kubernetes Networking

### 21.1 Pod Network Model

Kubernetes expects:

- Every Pod gets its own IP.
- Pods can communicate with other Pods without NAT.
- Nodes can communicate with Pods.

This is provided by the CNI plugin.

### 21.2 Service

Pods are temporary. Their IPs change.

A Service gives stable networking for a group of Pods.

```mermaid
flowchart LR
    Client["Client"] --> Service["Service: demo-api"]
    Service --> Pod1["Pod A"]
    Service --> Pod2["Pod B"]
    Service --> Pod3["Pod C"]
```

### 21.3 ClusterIP Service

Default service type. Exposes app inside cluster.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-api
spec:
  type: ClusterIP
  selector:
    app: demo-api
  ports:
    - port: 80
      targetPort: 3000
```

Meaning:

- `type: ClusterIP`: internal stable IP.
- `selector.app`: send traffic to Pods with label `app=demo-api`.
- `port: 80`: service port.
- `targetPort: 3000`: Pod container port.

### 21.4 NodePort Service

Exposes service on every node at a port.

```yaml
spec:
  type: NodePort
```

Useful for simple testing. Less common for polished production entrypoints.

### 21.5 LoadBalancer Service

Cloud provider creates external load balancer.

```yaml
spec:
  type: LoadBalancer
```

Common in managed Kubernetes clusters.

### 21.6 ExternalName Service

Maps service name to external DNS name.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: db.example.com
```

### 21.7 Ingress

Ingress routes HTTP/HTTPS traffic into cluster.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-api
spec:
  rules:
    - host: demo.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-api
                port:
                  number: 80
```

You need an Ingress controller such as:

- NGINX Ingress Controller
- Traefik
- HAProxy
- cloud-provider ingress controller

### 21.8 Gateway API

Gateway API is a newer, more expressive way to model traffic routing.

It separates:

- Infrastructure owner concerns: GatewayClass, Gateway
- Application owner concerns: HTTPRoute, TCPRoute, GRPCRoute

Ingress is still widely used. Gateway API is increasingly common for advanced routing.

### 21.9 NetworkPolicy

NetworkPolicy controls Pod-to-Pod traffic, if supported by the CNI.

Example: allow only frontend Pods to talk to API Pods.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
spec:
  podSelector:
    matchLabels:
      app: demo-api
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: frontend
      ports:
        - protocol: TCP
          port: 3000
```

Important: NetworkPolicy behavior depends on CNI support.

---

## 22. ConfigMaps and Secrets

### 22.1 ConfigMap

Use ConfigMap for non-secret configuration.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-api-config
data:
  PORT: "3000"
  LOG_LEVEL: "info"
```

Use in Deployment:

```yaml
envFrom:
  - configMapRef:
      name: demo-api-config
```

### 22.2 Secret

Use Secret for sensitive values.

```bash
kubectl create secret generic demo-api-secret \
  --from-literal=DATABASE_URL='postgres://postgres:secret@postgres:5432/app'
```

Use in Deployment:

```yaml
envFrom:
  - secretRef:
      name: demo-api-secret
```

Important:

- Kubernetes Secrets are base64-encoded by default, not automatically encrypted in every setup.
- Enable encryption at rest for production clusters.
- Prefer external secret managers for serious production systems.

### 22.3 Mount Config as Files

```yaml
volumes:
  - name: config
    configMap:
      name: app-config
containers:
  - name: api
    volumeMounts:
      - name: config
        mountPath: /etc/app
```

Files from ConfigMap appear inside `/etc/app`.

---

## 23. Kubernetes Storage

### 23.1 Volume

A Pod volume is mounted into containers.

Some volume types:

- `emptyDir`
- `configMap`
- `secret`
- `persistentVolumeClaim`
- `hostPath`
- CSI volumes

### 23.2 emptyDir

```yaml
volumes:
  - name: cache
    emptyDir: {}
```

Exists as long as Pod exists. Deleted when Pod is removed.

### 23.3 PersistentVolume and PersistentVolumeClaim

PersistentVolume, or PV, is actual storage.

PersistentVolumeClaim, or PVC, is a request for storage.

```mermaid
flowchart LR
    Pod["Pod"] --> PVC["PVC: request 10Gi"]
    PVC --> PV["PV: actual disk"]
    PV --> Disk["Cloud disk / storage backend"]
```

PVC example:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 23.4 StorageClass

StorageClass describes how to dynamically provision storage.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
```

### 23.5 Access Modes

| Mode | Meaning |
|---|---|
| ReadWriteOnce | Mounted read-write by one node |
| ReadOnlyMany | Mounted read-only by many nodes |
| ReadWriteMany | Mounted read-write by many nodes |
| ReadWriteOncePod | Mounted read-write by one Pod |

Actual support depends on storage provider.

### 23.6 StatefulSet With Volume Claims

```yaml
volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

Each StatefulSet Pod gets its own PVC.

---

## 24. Scheduling and Resource Management

### 24.1 Requests and Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

Requests:

- Used by scheduler.
- Minimum expected resources.

Limits:

- Maximum allowed resources.
- Memory limit can cause container to be killed if exceeded.

CPU units:

- `100m` means 0.1 CPU core.
- `1000m` means 1 CPU core.

Memory units:

- `Mi`: mebibytes.
- `Gi`: gibibytes.

### 24.2 Quality of Service

Kubernetes assigns QoS class:

- Guaranteed: requests equal limits for all containers.
- Burstable: some requests/limits set.
- BestEffort: no requests or limits.

During pressure, BestEffort Pods are easiest to evict.

### 24.3 Node Selector

```yaml
nodeSelector:
  disk: ssd
```

Pod schedules only on nodes with label `disk=ssd`.

### 24.4 Affinity

More expressive scheduling rules.

Example:

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: demo-api
          topologyKey: kubernetes.io/hostname
```

Meaning: prefer spreading `demo-api` Pods across different nodes.

### 24.5 Taints and Tolerations

Taint a node:

```bash
kubectl taint nodes node1 dedicated=database:NoSchedule
```

Only Pods with matching toleration can schedule there.

Toleration:

```yaml
tolerations:
  - key: dedicated
    operator: Equal
    value: database
    effect: NoSchedule
```

### 24.6 Topology Spread

Spread Pods across zones or nodes.

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: demo-api
```

---

## 25. Probes and Health

### 25.1 Liveness Probe

If liveness fails, Kubernetes restarts the container.

Use for deadlock or unrecoverable stuck states.

### 25.2 Readiness Probe

If readiness fails, Kubernetes removes Pod from Service endpoints.

Use when app is alive but not ready for traffic.

### 25.3 Startup Probe

Gives slow-starting apps time before liveness checks begin.

Example:

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 3000
  failureThreshold: 30
  periodSeconds: 2
```

This gives up to 60 seconds.

### 25.4 Probe Types

```yaml
httpGet:
  path: /health
  port: 3000
```

HTTP probe.

```yaml
tcpSocket:
  port: 5432
```

TCP port probe.

```yaml
exec:
  command: ["sh", "-c", "test -f /tmp/healthy"]
```

Command probe.

---

## 26. Autoscaling

### 26.1 Horizontal Pod Autoscaler

HPA changes replica count.

```bash
kubectl autoscale deployment demo-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10
```

Meaning:

- Keep average CPU around 70 percent.
- Minimum 2 Pods.
- Maximum 10 Pods.

YAML:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: demo-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: demo-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 26.2 Vertical Pod Autoscaler

VPA recommends or changes CPU/memory requests.

Use carefully with apps that cannot restart often.

### 26.3 Cluster Autoscaler

Adds/removes nodes based on pending Pods and utilization.

### 26.4 KEDA

KEDA scales workloads based on external events:

- Queue length
- Kafka lag
- Prometheus metrics
- Cron
- Cloud events

---

## 27. Kubernetes Security

### 27.1 Security Layers

Kubernetes security includes:

- API authentication
- Authorization
- Admission control
- Pod security
- Network policy
- Image security
- Secret handling
- Node hardening
- Audit logging
- Runtime detection

### 27.2 Service Accounts

Pods use ServiceAccounts to talk to Kubernetes API.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: demo-api
```

Use in Pod:

```yaml
serviceAccountName: demo-api
```

### 27.3 RBAC

Role:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
```

RoleBinding:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
  - kind: ServiceAccount
    name: demo-api
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

Meaning:

- Role defines permissions.
- RoleBinding grants permissions to a subject.

### 27.4 Pod Security Context

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
```

Meaning:

- Do not run as root.
- Use UID `10001`.
- Prevent privilege escalation.
- Make root filesystem read-only.
- Drop Linux capabilities.

### 27.5 Pod Security Standards

Common levels:

- Privileged: unrestricted.
- Baseline: prevents known privilege escalations.
- Restricted: strongest common standard.

Use namespace labels to enforce:

```bash
kubectl label namespace prod pod-security.kubernetes.io/enforce=restricted
```

### 27.6 Admission Controllers

Admission runs after authentication/authorization but before object is stored.

Uses:

- Reject unsafe Pods.
- Require labels.
- Mutate manifests.
- Enforce image policies.
- Inject sidecars.

Tools:

- ValidatingAdmissionPolicy
- OPA Gatekeeper
- Kyverno

### 27.7 Image Security

Recommended:

- Use trusted base images.
- Pin versions.
- Scan images.
- Sign images.
- Generate SBOMs.
- Avoid root.
- Remove package managers from runtime images when possible.
- Use distroless or minimal images where appropriate.

---

## 28. Observability

### 28.1 Three Pillars

Common observability signals:

- Logs: what happened.
- Metrics: numeric measurements over time.
- Traces: request path across services.

Also important:

- Events
- Profiles
- Audit logs

### 28.2 kubectl Logs

```bash
kubectl logs deployment/demo-api
kubectl logs deployment/demo-api -f
kubectl logs pod/demo-api-abc123 -c api
```

### 28.3 Events

```bash
kubectl get events --sort-by=.lastTimestamp
```

Useful for:

- Failed scheduling
- Image pull errors
- Probe failures
- Volume mount errors

### 28.4 Describe

```bash
kubectl describe pod <pod-name>
```

Shows:

- Container state
- Last termination reason
- Events
- Mounts
- Environment
- Node
- Conditions

### 28.5 Metrics

```bash
kubectl top nodes
kubectl top pods
```

Requires metrics-server.

Production monitoring often uses:

- Prometheus
- Grafana
- Alertmanager
- OpenTelemetry
- cloud provider monitoring

### 28.6 Useful App Metrics

Track:

- Request rate
- Error rate
- Latency percentiles
- Saturation
- Queue depth
- Database connection count
- Restart count
- CPU and memory

---

## 29. Helm

### 29.1 What Is Helm?

Helm is a package manager and templating tool for Kubernetes.

It packages Kubernetes manifests into charts.

### 29.2 Chart Structure

```text
mychart/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
```

### 29.3 Install a Chart

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-postgres bitnami/postgresql
```

### 29.4 Values

`values.yaml`

```yaml
replicaCount: 3
image:
  repository: ghcr.io/example/demo-api
  tag: 1.0.0
```

Template:

```yaml
replicas: {{ .Values.replicaCount }}
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

### 29.5 Helm Commands

```bash
helm install demo ./chart
helm upgrade demo ./chart
helm upgrade --install demo ./chart
helm rollback demo 1
helm uninstall demo
helm template demo ./chart
```

---

## 30. Kustomize

### 30.1 What Is Kustomize?

Kustomize customizes raw Kubernetes YAML without templates.

Base:

```text
k8s/base/
  deployment.yaml
  service.yaml
  kustomization.yaml
```

Overlay:

```text
k8s/overlays/prod/
  kustomization.yaml
  patch.yaml
```

### 30.2 Base kustomization.yaml

```yaml
resources:
  - deployment.yaml
  - service.yaml
```

### 30.3 Production Overlay

```yaml
resources:
  - ../../base

patches:
  - path: patch.yaml
```

Patch:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
spec:
  replicas: 5
```

Apply:

```bash
kubectl apply -k k8s/overlays/prod
```

---

## 31. GitOps and CI/CD

### 31.1 CI vs CD

CI:

- Build
- Test
- Scan
- Package

CD:

- Deploy
- Promote
- Roll back
- Verify

### 31.2 GitOps Idea

Git is the source of truth for desired cluster state.

Flow:

```mermaid
flowchart LR
    Dev["Developer"] --> Git["Git repo"]
    CI["CI pipeline"] --> Registry["Image registry"]
    CI --> Git
    GitOps["GitOps controller"] --> Cluster["Kubernetes cluster"]
    Registry --> Cluster
```

Tools:

- Argo CD
- Flux
- Kluctl

### 31.3 GitHub Actions Example

```yaml
name: build-and-update-manifest

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/my-org/demo-api:${{ github.sha }}

      - name: Update image tag
        run: |
          sed -i "s|image: ghcr.io/my-org/demo-api:.*|image: ghcr.io/my-org/demo-api:${GITHUB_SHA}|" k8s/deployment.yaml
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add k8s/deployment.yaml
          git commit -m "Update demo-api image"
          git push
```

Production note: many teams update a separate environment repo rather than committing generated changes into the app repo.

---

## 32. Complete Kubernetes Demo Deployment

### 32.1 Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: demo
```

Apply:

```bash
kubectl apply -f namespace.yaml
```

### 32.2 ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-api-config
  namespace: demo
data:
  PORT: "3000"
  LOG_LEVEL: "info"
```

### 32.3 Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: demo-api-secret
  namespace: demo
type: Opaque
stringData:
  DATABASE_URL: postgres://postgres:secret@postgres:5432/app
```

Line by line:

- `kind: Secret`: sensitive config object.
- `type: Opaque`: generic key-value secret.
- `stringData`: lets you write plain strings; Kubernetes stores them encoded.

Do not commit real production secrets to Git.

### 32.4 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
  namespace: demo
  labels:
    app: demo-api
spec:
  replicas: 3
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: demo-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      serviceAccountName: demo-api
      containers:
        - name: api
          image: ghcr.io/example/demo-api:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 3000
          envFrom:
            - configMapRef:
                name: demo-api-config
            - secretRef:
                name: demo-api-secret
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          securityContext:
            runAsNonRoot: true
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
```

Important line explanations:

- `replicas: 3`: run three Pods.
- `revisionHistoryLimit: 5`: keep last five rollout revisions.
- `selector.matchLabels`: Deployment owns Pods matching `app=demo-api`.
- `maxUnavailable: 1`: at most one old Pod unavailable during rollout.
- `maxSurge: 1`: at most one extra Pod during rollout.
- `serviceAccountName`: run Pod with named ServiceAccount.
- `imagePullPolicy: IfNotPresent`: pull image only if missing locally.
- `ports.name: http`: gives the port a name so probes and Services can reference it.
- `envFrom`: load all keys from ConfigMap and Secret.
- `readinessProbe`: controls traffic eligibility.
- `livenessProbe`: controls restart if unhealthy.
- `resources`: helps scheduler and prevents uncontrolled usage.
- `securityContext`: hardens container.

### 32.5 Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-api
  namespace: demo
spec:
  type: ClusterIP
  selector:
    app: demo-api
  ports:
    - name: http
      port: 80
      targetPort: http
```

Line by line:

- `type: ClusterIP`: expose inside cluster.
- `selector.app`: send traffic to matching Pods.
- `port: 80`: service port.
- `targetPort: http`: named container port from Deployment.

### 32.6 Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-api
  namespace: demo
spec:
  ingressClassName: nginx
  rules:
    - host: demo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-api
                port:
                  number: 80
```

### 32.7 Apply Everything

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f serviceaccount.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

Or:

```bash
kubectl apply -f k8s/
```

### 32.8 Verify

```bash
kubectl get all -n demo
kubectl get pods -n demo
kubectl describe deployment demo-api -n demo
kubectl logs deployment/demo-api -n demo
kubectl rollout status deployment/demo-api -n demo
```

### 32.9 Port Forward

```bash
kubectl port-forward -n demo service/demo-api 8080:80
```

Open:

```text
http://localhost:8080
```

---

## 33. Kubernetes Installation and Local Clusters

### 33.1 Local Learning Options

Good options:

- Docker Desktop Kubernetes
- KinD
- minikube
- k3d
- MicroK8s

### 33.2 KinD

KinD runs Kubernetes nodes as Docker containers.

Create cluster:

```bash
kind create cluster --name demo
```

Check:

```bash
kubectl cluster-info
kubectl get nodes
```

Delete:

```bash
kind delete cluster --name demo
```

### 33.3 minikube

```bash
minikube start
kubectl get nodes
minikube dashboard
minikube stop
```

### 33.4 kubeadm

kubeadm bootstraps production-like clusters.

High-level steps:

1. Prepare machines.
2. Install container runtime.
3. Install `kubeadm`, `kubelet`, and `kubectl`.
4. Run `kubeadm init` on control plane.
5. Install CNI plugin.
6. Join worker nodes with `kubeadm join`.

Example:

```bash
kubeadm init --pod-network-cidr=10.244.0.0/16
```

Then configure kubectl:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Install CNI after init, otherwise Pods may stay Pending.

### 33.5 Managed Kubernetes

Managed services:

- GKE on Google Cloud
- EKS on AWS
- AKS on Azure
- Civo Kubernetes
- DigitalOcean Kubernetes

Cloud provider manages much of the control plane. You still manage workloads, policies, upgrades, costs, and security posture.

---

## 34. Debugging Kubernetes

### 34.1 First Commands

```bash
kubectl get pods -A
kubectl get events -A --sort-by=.lastTimestamp
kubectl describe pod <pod> -n <namespace>
kubectl logs <pod> -n <namespace>
```

### 34.2 Pod Pending

Possible causes:

- Not enough CPU or memory.
- Node selector does not match.
- Taints not tolerated.
- PVC not bound.
- Image pull secret missing.
- Cluster autoscaler cannot add node.

Commands:

```bash
kubectl describe pod <pod>
kubectl get nodes
kubectl describe nodes
kubectl get pvc
```

### 34.3 ImagePullBackOff

Possible causes:

- Image name wrong.
- Tag missing.
- Registry private.
- Bad imagePullSecret.
- Registry rate limit.

Commands:

```bash
kubectl describe pod <pod>
kubectl get secret
kubectl create secret docker-registry regcred ...
```

### 34.4 CrashLoopBackOff

The container starts, crashes, restarts repeatedly.

Commands:

```bash
kubectl logs <pod>
kubectl logs <pod> --previous
kubectl describe pod <pod>
```

Look for:

- Missing environment variables.
- Bad command.
- App cannot connect to dependency.
- File permission error.
- Out of memory.
- Failed migration.

### 34.5 Service Not Working

Check:

```bash
kubectl get svc
kubectl get endpoints
kubectl get endpointslice
kubectl get pods --show-labels
```

Common issue: Service selector does not match Pod labels.

### 34.6 DNS Debug Pod

```bash
kubectl run dns-debug --rm -it --image=busybox:1.36 -- sh
```

Inside:

```sh
nslookup kubernetes.default
nslookup demo-api.demo.svc.cluster.local
wget -qO- http://demo-api.demo.svc.cluster.local/health
```

### 34.7 Ephemeral Debug Containers

```bash
kubectl debug -it pod/<pod-name> --image=busybox --target=api
```

Useful when the app image lacks shell or tools.

---

## 35. CRDs and Operators

### 35.1 Custom Resource Definition

CRD adds a new API type to Kubernetes.

Example kinds from real systems:

- `Certificate` from cert-manager
- `ExternalSecret` from External Secrets Operator
- `PostgresCluster` from database operators
- `Prometheus` from Prometheus Operator

### 35.2 Operator

An operator is a controller for custom resources.

Example:

```text
You create PostgresCluster YAML.
Operator creates StatefulSets, Services, PVCs, backups, users, and failover logic.
```

### 35.3 Operator Pattern

```mermaid
flowchart LR
    User["User applies custom resource"] --> API["Kubernetes API"]
    Operator["Operator controller"] --> API
    Operator --> Objects["Deployments / StatefulSets / Services / PVCs"]
```

Operators encode operational knowledge into software.

---

## 36. Multi-Environment Deployment

### 36.1 Environments

Common environments:

- local
- dev
- test
- staging
- production

They differ by:

- replica count
- resource limits
- secrets
- domain names
- feature flags
- database endpoints
- scaling rules

### 36.2 Do Not Fork Everything

Bad pattern:

```text
k8s-dev/
k8s-staging/
k8s-prod/
```

with copied files everywhere.

Better:

- Shared base manifests.
- Small overlays per environment.
- Helm values per environment.
- GitOps folders per environment.

### 36.3 Image Promotion

Good:

```text
same image digest -> dev -> staging -> prod
```

Risky:

```text
rebuild separately for each environment
```

Because every rebuild can produce different content.

---

## 37. Cluster Upgrades

### 37.1 Upgrade Concerns

Consider:

- Kubernetes version skew rules.
- API deprecations.
- Add-on compatibility.
- CNI compatibility.
- CSI compatibility.
- Ingress controller compatibility.
- PodDisruptionBudgets.
- Node drain behavior.
- Control plane backups.

### 37.2 Drain a Node

```bash
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data
```

Meaning:

- Evict normal Pods from node.
- Ignore DaemonSet Pods.
- Allow deletion of `emptyDir` data.

Return node:

```bash
kubectl uncordon node1
```

### 37.3 PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: demo-api
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: demo-api
```

Ensures at least two matching Pods remain available during voluntary disruptions.

---

## 38. Docker vs Kubernetes Mapping

| Docker | Kubernetes |
|---|---|
| Container | Container inside Pod |
| `docker run` | Pod or Deployment |
| Docker image | Container image |
| Docker volume | Volume/PVC |
| Docker network | CNI Pod network |
| `docker logs` | `kubectl logs` |
| `docker exec` | `kubectl exec` |
| Compose service | Deployment + Service |
| Compose file | Kubernetes manifests/Helm/Kustomize |
| Port mapping | Service/Ingress/Gateway |
| Restart policy | Pod restartPolicy + controllers |

---

## 39. Command Cheat Sheet

### 39.1 Docker

```bash
docker version
docker info
docker pull nginx
docker build -t myapp:dev .
docker run --rm -p 8080:80 nginx
docker ps
docker ps -a
docker logs -f <container>
docker exec -it <container> sh
docker inspect <container>
docker stop <container>
docker rm <container>
docker image ls
docker rmi <image>
docker volume ls
docker network ls
docker system df
```

### 39.2 Docker Compose

```bash
docker compose up
docker compose up -d
docker compose up --build
docker compose down
docker compose down -v
docker compose logs -f
docker compose ps
docker compose exec api sh
docker compose pull
docker compose build
```

### 39.3 Kubernetes

```bash
kubectl version
kubectl cluster-info
kubectl get nodes
kubectl get pods -A
kubectl get all -n <namespace>
kubectl apply -f file.yaml
kubectl apply -k k8s/overlays/prod
kubectl describe pod <pod>
kubectl logs <pod>
kubectl logs deployment/<deployment> -f
kubectl exec -it <pod> -- sh
kubectl rollout status deployment/<deployment>
kubectl rollout undo deployment/<deployment>
kubectl scale deployment/<deployment> --replicas=5
kubectl port-forward service/<service> 8080:80
kubectl delete -f file.yaml
```

---

## 40. Learning Path From Beginner to Advanced

### Stage 1: Docker Basics

Practice:

1. Install Docker.
2. Run `hello-world`.
3. Run `nginx`.
4. Publish a port.
5. View logs.
6. Exec into a container.
7. Remove containers.

### Stage 2: Images and Dockerfiles

Practice:

1. Build a small Node/Python app image.
2. Add `.dockerignore`.
3. Use non-root user.
4. Use multi-stage build.
5. Tag and push image.

### Stage 3: Compose

Practice:

1. Run app plus database.
2. Use volumes.
3. Use environment variables.
4. Add health checks.
5. Debug service DNS.

### Stage 4: Kubernetes Basics

Practice:

1. Create local cluster with KinD or minikube.
2. Deploy a Deployment.
3. Expose with Service.
4. Use ConfigMap and Secret.
5. Check logs and events.

### Stage 5: Kubernetes Production Concepts

Practice:

1. Add probes.
2. Add resource requests/limits.
3. Add HPA.
4. Add Ingress.
5. Add NetworkPolicy.
6. Add RBAC.
7. Add Pod security context.

### Stage 6: Delivery and Operations

Practice:

1. Build image in CI.
2. Push to registry.
3. Deploy with Helm or Kustomize.
4. Use GitOps.
5. Monitor with Prometheus/Grafana.
6. Debug failures.
7. Plan upgrades.

---

## 41. Common Mistakes

### Docker Mistakes

- Putting secrets in Dockerfile.
- Using `latest` in production.
- Running as root unnecessarily.
- Making images huge.
- Ignoring `.dockerignore`.
- Installing dependencies after copying all source.
- Treating containers like virtual machines.
- Storing database data only in container writable layer.
- Mounting Docker socket without understanding risk.

### Kubernetes Mistakes

- Creating bare Pods instead of Deployments.
- Missing resource requests.
- Confusing readiness and liveness.
- Service selector does not match Pod labels.
- Committing production secrets to Git.
- Giving broad RBAC permissions.
- Running privileged Pods unnecessarily.
- No PodDisruptionBudget for important replicated apps.
- No NetworkPolicy in sensitive environments.
- No backup plan for persistent data.
- Rebuilding images separately for each environment.

---

## 42. Advanced Docker Topics

### 42.1 OCI

OCI means Open Container Initiative.

It defines open standards for:

- Container image format
- Runtime behavior
- Distribution

Why it matters:

- Docker images can run on Kubernetes.
- Kubernetes can use containerd or CRI-O.
- Tools can interoperate because they follow common standards.

### 42.2 Docker Daemon Configuration

Docker daemon settings usually live in:

```text
/etc/docker/daemon.json
```

Example:

```json
{
  "log-driver": "local",
  "storage-driver": "overlay2",
  "features": {
    "buildkit": true
  }
}
```

Meaning:

- `log-driver`: controls container log storage.
- `storage-driver`: controls image/container layer storage.
- `features.buildkit`: enables modern build engine.

Restart Docker after daemon changes.

### 42.3 Logging Drivers

Docker can send logs to different backends.

Common drivers:

- `json-file`
- `local`
- `journald`
- `syslog`
- `fluentd`
- `awslogs`
- `gelf`
- `splunk`

For local machines, `local` is often safer than unlimited JSON logs because it has better default rotation behavior.

### 42.4 Restart Policies

```bash
docker run -d --restart unless-stopped nginx
```

Common policies:

| Policy | Meaning |
|---|---|
| no | Do not restart automatically |
| on-failure | Restart only on non-zero exit |
| always | Always restart |
| unless-stopped | Restart unless user stopped it |

### 42.5 Docker Swarm

Docker Swarm is Docker's built-in orchestration mode.

It supports:

- Services
- Replicas
- Overlay networks
- Secrets
- Configs
- Rolling updates

Basic example:

```bash
docker swarm init
docker service create --name web --replicas 3 -p 8080:80 nginx
docker service ls
docker service scale web=5
```

Kubernetes is more common in large production ecosystems, but Swarm is simpler for some smaller Docker-native deployments.

### 42.6 Container Image SBOMs and Attestations

SBOM means Software Bill of Materials.

It lists what is inside an image:

- OS packages
- language packages
- versions
- licenses

Why it matters:

- vulnerability tracking
- compliance
- incident response
- supply chain security

Common tools:

- Syft
- Trivy
- Docker Scout
- BuildKit provenance
- cosign attestations

### 42.7 Signing Images

Image signing proves an image came from a trusted source.

Common tool:

```bash
cosign sign ghcr.io/example/demo-api:1.0.0
cosign verify ghcr.io/example/demo-api:1.0.0
```

In production, admission policies can reject unsigned images.

---

## 43. Advanced Kubernetes Ecosystem Tools

### 43.1 Tilt

Tilt improves local Kubernetes development.

It can:

- Watch files
- Rebuild images
- Redeploy workloads
- Stream logs
- Show service status
- Run local resources

Simple `Tiltfile`:

```python
docker_build("demo-api", ".")
k8s_yaml(["k8s/deployment.yaml", "k8s/service.yaml"])
k8s_resource("demo-api", port_forwards=3000)
```

Line by line:

- `docker_build("demo-api", ".")`: build image from current directory.
- `k8s_yaml(...)`: load Kubernetes YAML.
- `k8s_resource(...)`: group resource and forward local port.

### 43.2 External Secrets Operator

External Secrets Operator syncs secrets from external secret managers into Kubernetes Secrets.

External providers can include:

- AWS Secrets Manager
- Google Secret Manager
- Azure Key Vault
- HashiCorp Vault
- Doppler
- 1Password

Example shape:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: demo-api
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: team-secrets
    kind: SecretStore
  target:
    name: demo-api-secret
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: prod/demo-api/database-url
```

Meaning:

- Read secret from external manager.
- Create or update Kubernetes Secret named `demo-api-secret`.
- Refresh periodically.

### 43.3 Trivy Operator

Trivy Operator runs security checks inside Kubernetes.

It can produce reports for:

- Image vulnerabilities
- Config risks
- Exposed secrets
- RBAC risks
- Cluster compliance

Typical workflow:

```bash
kubectl get vulnerabilityreports -A
kubectl describe vulnerabilityreport <name> -n <namespace>
```

Use it as a signal, not as the only security control.

### 43.4 CloudNativePG

CloudNativePG is a Kubernetes operator for PostgreSQL.

It can manage:

- PostgreSQL clusters
- replication
- failover
- backups
- recovery
- users/databases
- monitoring integration

Example shape:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
spec:
  instances: 3
  storage:
    size: 20Gi
```

Important production note:

Databases on Kubernetes can work well, but they require serious storage, backup, restore, monitoring, and upgrade discipline.

### 43.5 Kluctl

Kluctl is a deployment tool for Kubernetes that helps organize multi-environment deployments.

It can combine:

- Kustomize
- Helm
- templating
- environment targets
- diff and deploy workflows

Basic mental model:

```text
shared deployment project
  target dev
  target staging
  target prod
```

Useful when plain Helm or plain Kustomize becomes awkward across many services and environments.

### 43.6 Shipyard-Style Ephemeral Environments

Ephemeral environments are temporary environments created for a branch, pull request, demo, or test.

They help teams:

- test real deployments before merge
- preview product changes
- run integration tests
- isolate experiments

Common flow:

```text
pull request opened
CI builds image
environment is created
app is deployed with unique URL
tests run
review happens
pull request merged or closed
environment is destroyed
```

Tools in this space include Shipyard-like platforms, preview environments in cloud platforms, and custom GitOps automation.

### 43.7 Skaffold, DevSpace, and Telepresence

Other developer experience tools:

- Skaffold: build, push, and deploy loop for Kubernetes.
- DevSpace: local development workflows for Kubernetes.
- Telepresence: connect local service to remote cluster network.

The right tool depends on the team:

- If you need simple local inner loop, try Tilt or Skaffold.
- If you need preview environments, use ephemeral environment automation.
- If you need to debug one service against remote dependencies, use Telepresence carefully.

---

## 44. Production Readiness Checklists

### 44.1 Docker Image Checklist

- Uses specific base image version.
- Has `.dockerignore`.
- Installs dependencies before copying frequently changing source.
- Uses multi-stage build where useful.
- Runs as non-root.
- Does not contain secrets.
- Has health endpoint if it runs a service.
- Keeps runtime image small.
- Pins important dependencies.
- Is scanned for vulnerabilities.
- Has SBOM/provenance if required.

### 44.2 Kubernetes App Checklist

- Deployment or StatefulSet used instead of bare Pods.
- Resource requests are set.
- Memory limits are set intentionally.
- Readiness probe exists.
- Liveness probe exists only when useful.
- Startup probe exists for slow-starting apps.
- ConfigMaps used for non-secrets.
- Secrets or external secret manager used for secrets.
- Service selector matches Pod labels.
- Pod security context is hardened.
- RBAC follows least privilege.
- NetworkPolicy exists for sensitive namespaces.
- PodDisruptionBudget exists for important replicated services.
- HPA or scaling plan exists.
- Logs and metrics are collected.
- Rollback path is tested.
- Backups and restores are tested for stateful apps.

### 44.3 Cluster Checklist

- Control plane is highly available if production-critical.
- etcd backup and restore are tested.
- Nodes are patched.
- Cluster version skew is understood.
- CNI is production-grade and monitored.
- CSI driver is production-grade and monitored.
- Ingress or Gateway controller is monitored.
- Admission policies enforce security rules.
- Audit logging is enabled where required.
- Secrets are encrypted at rest.
- Image registry access is controlled.
- Disaster recovery plan exists.
- Upgrade plan exists.

---

## 45. Glossary

| Term | Simple meaning |
|---|---|
| Container | Isolated process with its own filesystem/network view |
| Image | Template used to create containers |
| Dockerfile | Instructions for building an image |
| Layer | Reusable filesystem change in an image |
| Registry | Server that stores images |
| Volume | Persistent data storage for containers |
| Bind mount | Host path mounted into container |
| Compose | Tool for defining multi-container Docker apps |
| Pod | Smallest Kubernetes deployable unit |
| Deployment | Kubernetes object for stateless app rollout/scaling |
| StatefulSet | Kubernetes object for stateful apps with stable identity |
| DaemonSet | Runs one Pod per selected node |
| Job | Runs task to completion |
| CronJob | Runs Jobs on a schedule |
| Service | Stable network endpoint for Pods |
| Ingress | HTTP routing into cluster |
| Gateway API | Advanced traffic routing API |
| ConfigMap | Non-secret configuration |
| Secret | Sensitive configuration |
| PVC | Request for persistent storage |
| CNI | Plugin system for container networking |
| CSI | Plugin system for storage |
| CRD | Custom Kubernetes API type |
| Operator | Controller that manages an application using custom resources |
| Helm | Kubernetes package/template tool |
| Kustomize | Kubernetes YAML customization tool |
| GitOps | Git as source of truth for deployments |

---

## 46. Final Mental Models

### Docker Mental Model

```text
Dockerfile -> image -> container
container + volume = persistent data
container + network = communication
registry = image storage
Compose = local multi-container app definition
```

### Kubernetes Mental Model

```text
YAML -> API server -> desired state in etcd
controllers watch desired state
scheduler places Pods
kubelet runs Pods
Services give stable networking
Ingress/Gateway brings traffic in
ConfigMaps/Secrets inject configuration
PVCs attach storage
RBAC controls permissions
probes and metrics keep systems healthy
```

### One-Sentence Summary

Docker packages and runs applications as containers; Kubernetes keeps many containers running correctly across a cluster.
