# atrox-serverless-aws-sample

`atrox-serverless-aws-sample` is a sample AWS serverless solution built around independent Lambda services, a unified API Gateway, Aurora PostgreSQL, DynamoDB, SQS, SNS, and shared infrastructure for secure networking inside a VPC.

This project is meant to demonstrate:

- serverless backend design on AWS
- layered architecture in Node.js
- API Gateway + Lambda integration
- Aurora PostgreSQL connectivity from Lambda
- asynchronous audit processing with SQS
- idempotency for mutable operations
- VPC, Security Groups, route tables, VPC endpoints, and NAT Gateway usage

## 1. Solution Overview

The sample is organized into three main domains:

- `atrox_database`
  Database scripts for Aurora PostgreSQL and DynamoDB.
- `atrox_cross_api`
  Shared cross-cutting serverless services such as audit and idempotency.
- `atrox_entity_api`
  Entity-focused Lambda APIs: get, create, update, delete, and list.

## 2. Main Components

### Aurora PostgreSQL

Aurora stores transactional data such as:

- `entity`
- `catalog`
- `client`
- `address`

SQL scripts create:

- tables
- constraints
- indexes
- stored functions
- seed data

### DynamoDB

DynamoDB is used for cross services:

- `atrox-idempotency`
- `atrox-audit`

### Cross APIs

#### `atrox_cross_audit_api`

Responsible for asynchronous audit registration.

- consumes SQS and SNS
- persists audit records into DynamoDB
- keeps audit concerns out of the business Lambdas

#### `atrox_cross_idempotency_api`

Responsible for idempotency resolution.

- exposed through API Gateway
- checks existing request state
- returns HIT / MISS / CONFLICT style outcomes

### Entity APIs

#### `atrox_get_entity_api`
- reads one entity by id

#### `atrox_set_entity_api`
- creates a new entity

#### `atrox_update_entity_api`
- updates an entity
- validates idempotency through the idempotency API

#### `atrox_delete_entity_api`
- performs soft delete
- validates idempotency through the idempotency API

#### `atrox_list_entity_api`
- returns all entities
- optionally filters by `status`

### Unified Gateway

`atrox_entity_api/unified_gateway`

Creates a single API Gateway that routes to the previously deployed Lambda functions, so the solution can be consumed through one shared entry point and one shared API key.

Example routes:

- `POST /atrox/entity/get`
- `POST /atrox/entity/create`
- `PUT /atrox/entity/update`
- `DELETE /atrox/entity/delete`
- `POST /atrox/entity/list`

Important note:

With API Gateway REST APIs, the visible URL format is:

```text
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/{path}
```

In this sample, the stage is intentionally configured as `atrox` so that the URL reads like:

```text
/atrox/entity/get
```

## 3. Layered Architecture

Each Lambda service follows a layered structure:

- `entrypoint`
  Lambda handlers and channel adapters (API, SQS, SNS)
- `application`
  Use cases and application orchestration
- `domain`
  Entities, contracts, business services
- `infrastructure`
  PostgreSQL repositories, DynamoDB repositories, audit dispatchers, idempotency clients, config
- `shared`
  HTTP responses, logging, metrics, helpers

This separation keeps transport, business logic, and infrastructure concerns isolated.

## 4. High-Level Flow

### Read Flow

1. API Gateway receives a request
2. Lambda handler maps the request
3. Application use case executes
4. Repository reads from Aurora PostgreSQL
5. Audit event is sent asynchronously to SQS
6. Response is returned to API Gateway

### Update/Delete Flow

1. API Gateway receives a mutable request
2. Lambda reads `x-idempotency-key`
3. Lambda calls the idempotency API
4. If the request is a HIT, it returns the stored response
5. If the request is a MISS, business logic continues
6. Data is updated in Aurora PostgreSQL
7. Audit event is dispatched to SQS
8. Final response is returned

## 5. Network and VPC Design

Aurora PostgreSQL runs inside a VPC. Lambda functions do not automatically join that VPC unless `VpcConfig` is explicitly defined.

That is why network configuration was required.

### VPC-related resources used in the sample

- VPC
- private subnets for Lambda
- security group for Lambda
- security group for Aurora
- VPC endpoint for SQS
- NAT Gateway for outbound internet access
- private route table for Lambda subnets

### Why this was needed

#### Lambda -> Aurora

Aurora is private and requires:

- same VPC
- allowed security group ingress on port `5432`

#### Lambda -> SQS

Audit dispatch from VPC-based Lambdas required private access to SQS.

#### Lambda -> Public Idempotency API

`update` and `delete` call a public API Gateway URL for idempotency. Since those Lambdas run in private subnets, outbound internet access was needed through a NAT Gateway.

## 6. Reference Architecture Diagram

```text
                           +-----------------------------+
                           |      Unified API Gateway    |
                           |      Stage: /atrox         |
                           +-------------+---------------+
                                         |
                                         v
                    +---------------------------------------------+
                    |     Entity Lambda APIs (Node.js)            |
                    |  get / create / update / delete / list      |
                    +----------------+----------------------------+
                                     |
                   +-----------------+------------------+
                   |                                    |
                   v                                    v
       +-----------------------------+      +------------------------------+
       |      Aurora PostgreSQL      |      |         SQS Audit Queue      |
       |       private in VPC        |      |   atrox-cross-audit-queue    |
       +-----------------------------+      +------------------------------+
                                     |
                                     v
                         +---------------------------+
                         |       NAT Gateway         |
                         +-------------+-------------+
                                       |
                                       v
                         +---------------------------+
                         |  Public Idempotency API   |
                         |  API Gateway + Lambda     |
                         +---------------------------+
```

## 7. Project Structure

```text
atrox_database/
  Aurora/
  DynamoDB/

atrox_cross_api/
  atrox_cross_audit_api/
  atrox_cross_idempotency_api/

atrox_entity_api/
  atrox_get_entity_api/
  atrox_set_entity_api/
  atrox_update_entity_api/
  atrox_delete_entity_api/
  atrox_list_entity_api/
  infrastructure/
  unified_gateway/
```

## 8. Installation and Deployment Procedure

### Prerequisites

- AWS CLI
- AWS SAM CLI
- Node.js
- PostgreSQL client (`psql`)
- AWS credentials configured locally

Validation commands:

```powershell
aws --version
sam --version
node --version
psql --version
aws sts get-caller-identity
```

### Step 1. Prepare Aurora PostgreSQL

Run the main Aurora script:

```powershell
psql -f ".\atrox_database\Aurora\run_all.sql"
```

Validate:

```sql
\dt
\df
SELECT current_database();
SELECT * FROM entity LIMIT 10;
```

### Step 2. Prepare DynamoDB

Create or validate:

- `atrox-idempotency`
- `atrox-audit`

Validation:

```powershell
aws dynamodb list-tables --region us-east-2
aws dynamodb describe-table --table-name atrox-idempotency --region us-east-2
aws dynamodb describe-table --table-name atrox-audit --region us-east-2
```

### Step 3. Deploy cross services

Deploy:

- `atrox_cross_audit_api`
- `atrox_cross_idempotency_api`

After deployment, collect:

- audit queue URL
- audit queue ARN
- idempotency API URL

Useful commands:

```powershell
aws sqs get-queue-url --queue-name atrox-cross-audit-queue --region us-east-2
aws sqs get-queue-attributes --queue-url "QUEUE_URL" --attribute-names QueueArn --region us-east-2
aws sns list-topics --region us-east-2
```

### Step 4. Prepare shared entity infrastructure

Deploy shared infrastructure under:

- `atrox_entity_api/infrastructure`

This stack is responsible for:

- Lambda security group reuse/creation
- RDS ingress support
- SQS endpoint reuse

Example deployment:

```powershell
cd .\atrox_entity_api\infrastructure
sam validate -t template.yaml
sam build -t template.yaml
sam deploy --stack-name atrox-entity-infrastructure --region us-east-2 --capabilities CAPABILITY_IAM --parameter-overrides VpcId=vpc-XXXXXXXX SubnetIds=subnet-AAA,subnet-BBB RdsSecurityGroupId=sg-RDS ExistingLambdaSecurityGroupId=sg-LAMBDA ExistingSqsVpcEndpointId=vpce-SQS
```

### Step 5. Configure route table and NAT

For `update` and `delete`, private Lambdas need outbound internet access to call the public idempotency API.

Required:

- NAT Gateway
- private route table
- `0.0.0.0/0 -> nat-...`
- association of Lambda subnets to that route table

### Step 6. Deploy entity services

For each entity service:

```powershell
cd .\atrox_entity_api\SERVICE_NAME
sam validate -t template.yaml
sam build -t template.yaml
sam deploy --guided
```

Main parameters:

- `AuditQueueUrl`
- `AuditQueueArn`
- `PgHost`
- `PgPort`
- `PgDatabase`
- `PgUser`
- `PgPassword`
- `PgSslMode`
- `VpcSubnetIds`
- `VpcSecurityGroupIds`

Additional parameters for `update` and `delete`:

- `IdempotencyApiUrl`
- `IdempotencyRequestIdHeader=x-idempotency-key`

### Step 7. Deploy unified gateway

```powershell
cd .\atrox_entity_api\atrox_api_gateway
sam validate -t template.yaml
sam build -t template.yaml
sam deploy --guided
```

Recommended values:

- `Stack Name`: `atrox-entity-unified-gateway`
- `AWS Region`: `us-east-2`
- `StageName`: `atrox`

## 9. API Usage Examples

### Get entity

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/get" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{""id"":1}"
```

### Create entity

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/create" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{""name"":""NEW_ENTITY_TEST"",""status"":1}"
```

### Update entity

```powershell
curl.exe -i -X PUT "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/update" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" -H "x-idempotency-key: update-entity-1-001" --data-raw "{""id"":1,""name"":""CLIENT_STATUS_UPDATED"",""status"":1,""requestId"":""update-entity-1-001"",""requestHash"":""HASH_AQUI""}"
```

### Delete entity

```powershell
curl.exe -i -X DELETE "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/delete" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" -H "x-idempotency-key: delete-entity-1-001" --data-raw "{""id"":1,""requestId"":""delete-entity-1-001"",""requestHash"":""HASH_AQUI""}"
```

### List entities

All:

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/list" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{}"
```

Only active:

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/list" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{""status"":1}"
```

Only deleted:

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/list" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{""status"":0}"
```

## 10. Validation Commands

CloudFormation:

```powershell
aws cloudformation describe-stacks --stack-name atrox-entity-infrastructure --region us-east-2
aws cloudformation describe-stacks --stack-name atrox-entity-unified-gateway --region us-east-2
```

Logs:

```powershell
aws logs describe-log-streams --log-group-name "/aws/lambda/atrox-get-entity-api" --region us-east-2 --order-by LastEventTime --descending --max-items 1
aws logs describe-log-streams --log-group-name "/aws/lambda/atrox-delete-entity-api" --region us-east-2 --order-by LastEventTime --descending --max-items 1
```

RDS:

```powershell
aws rds describe-db-instances --db-instance-identifier atroxdb --region us-east-2
```

API Keys:

```powershell
aws apigateway get-api-keys --include-values --region us-east-2
```

## 11. Key Design Decisions

- independent Lambda per action instead of one large CRUD handler
- shared API Gateway option for client simplicity
- audit as asynchronous concern through SQS
- idempotency as a separate reusable service
- layered architecture for maintainability
- VPC-based design for secure Aurora access

## 12. Notes

- `delete` is implemented as soft delete
- `list` supports optional `status` filter
- `update` and `delete` require `x-idempotency-key`
- Api gateway uses one shared API key and usage plan

## 13. What this project enables

It demonstrates much more than basic CRUD operations. It allows you to showcase:

- Serverless architecture on AWS
- Cloud deployment with SAM
- Real-world network problem resolution
- Security and consumption control via API Gateway
- Asynchronous integration
- Separation of responsibilities per service
