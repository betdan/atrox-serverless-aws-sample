# atrox-serverless-aws-sample

`atrox-serverless-aws-sample` es una solución de ejemplo en AWS serverless construida alrededor de servicios Lambda independientes, un API Gateway unificado, Aurora PostgreSQL, DynamoDB, SQS, SNS e infraestructura compartida para comunicación segura dentro de una VPC.

El objetivo del proyecto es demostrar:

- diseño backend serverless en AWS
- arquitectura por capas en Node.js
- integración API Gateway + Lambda
- conectividad Lambda hacia Aurora PostgreSQL
- auditoría asíncrona por SQS
- idempotencia para operaciones mutables
- uso de VPC, Security Groups, tablas de rutas, VPC endpoints y NAT Gateway

## 1. Visión general de la solución

El sample se organiza en tres dominios principales:

- `atrox_database`
  Scripts de base de datos para Aurora PostgreSQL y DynamoDB.
- `atrox_cross_api`
  Servicios serverless transversales como auditoría e idempotencia.
- `atrox_entity_api`
  APIs Lambda orientadas a entity: consulta, creación, actualización, eliminación y listado.

## 2. Componentes principales

### Aurora PostgreSQL

Aurora almacena datos transaccionales como:

- `entity`
- `catalog`
- `client`
- `address`

Los scripts SQL crean:

- tablas
- constraints
- índices
- funciones almacenadas
- datos semilla

### DynamoDB

DynamoDB se usa en servicios transversales:

- `atrox-idempotency`
- `atrox-audit`

### APIs cross

#### `atrox_cross_audit_api`

Se encarga del registro asíncrono de auditoría.

- consume SQS y SNS
- persiste auditoría en DynamoDB
- desacopla la auditoría de la lógica de negocio principal

#### `atrox_cross_idempotency_api`

Se encarga de resolver idempotencia.

- se expone por API Gateway
- valida estado previo de una solicitud
- responde escenarios tipo HIT / MISS / CONFLICT

### APIs de entity

#### `atrox_get_entity_api`
- consulta una entidad por id

#### `atrox_set_entity_api`
- crea una nueva entidad

#### `atrox_update_entity_api`
- actualiza una entidad
- valida idempotencia llamando al servicio de idempotencia

#### `atrox_delete_entity_api`
- realiza eliminación lógica
- valida idempotencia llamando al servicio de idempotencia

#### `atrox_list_entity_api`
- retorna todas las entidades
- permite filtro opcional por `status`

### Unified Gateway

`atrox_entity_api/atrox_api_gateway`

Crea un solo API Gateway para enrutar hacia las Lambdas ya desplegadas, de forma que el consumidor tenga un único punto de entrada y una sola API key.

Rutas de ejemplo:

- `POST /atrox/entity/get`
- `POST /atrox/entity/create`
- `PUT /atrox/entity/update`
- `DELETE /atrox/entity/delete`
- `POST /atrox/entity/list`

Nota importante:

Con API Gateway REST el formato visible de la URL es:

```text
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/{path}
```

En este proyecto el `stage` se configuró como `atrox`, por eso la URL se ve así:

```text
/atrox/entity/get
```

## 3. Arquitectura por capas

Cada servicio Lambda sigue esta estructura:

- `entrypoint`
  Handlers Lambda y adaptadores por canal (API, SQS, SNS)
- `application`
  Casos de uso y orquestación
- `domain`
  Entidades, contratos y servicios de negocio
- `infrastructure`
  Repositorios PostgreSQL, repositorios DynamoDB, despachadores de auditoría, clientes de idempotencia, configuración
- `shared`
  Respuestas HTTP, logging, métricas y utilitarios

Esto mantiene separadas las responsabilidades de transporte, negocio e infraestructura.

## 4. Flujo de alto nivel

### Flujo de lectura

1. API Gateway recibe una solicitud
2. El handler Lambda mapea la entrada
3. Se ejecuta el caso de uso
4. El repositorio consulta Aurora PostgreSQL
5. Se envía auditoría de forma asíncrona a SQS
6. Se devuelve la respuesta a API Gateway

### Flujo de update/delete

1. API Gateway recibe una solicitud mutable
2. Lambda lee `x-idempotency-key`
3. Lambda llama al API de idempotencia
4. Si es HIT, retorna la respuesta previa
5. Si es MISS, continúa la lógica de negocio
6. Se actualiza Aurora PostgreSQL
7. Se envía auditoría a SQS
8. Se retorna la respuesta final

## 5. Diseño de red y VPC

Aurora PostgreSQL vive dentro de una VPC. Las Lambdas no entran automáticamente a esa VPC si no se declara explícitamente `VpcConfig`.

Por eso fue necesario configurar red.

### Recursos de red usados

- VPC
- subnets privadas para Lambda
- security group para Lambda
- security group para Aurora
- VPC endpoint para SQS
- NAT Gateway para salida a internet
- tabla de rutas privada para las subnets de Lambda

### Por qué fue necesario

#### Lambda -> Aurora

Aurora es privada y requiere:

- misma VPC
- regla de ingreso permitida por security group en puerto `5432`

#### Lambda -> SQS

La auditoría desde Lambdas en VPC requirió acceso privado a SQS.

#### Lambda -> API pública de idempotencia

`update` y `delete` llaman a una URL pública de API Gateway para idempotencia. Como esas Lambdas están en subnets privadas, necesitaron salida a internet mediante NAT Gateway.

## 6. Diagrama de arquitectura de referencia

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
       |       privado en VPC        |      |   atrox-cross-audit-queue    |
       +-----------------------------+      +------------------------------+
                                     |
                                     v
                         +---------------------------+
                         |       NAT Gateway         |
                         +-------------+-------------+
                                       |
                                       v
                         +---------------------------+
                         |  API pública Idempotency  |
                         |  API Gateway + Lambda     |
                         +---------------------------+
```

## 7. Estructura del proyecto

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

## 8. Procedimiento de instalación y despliegue

### Prerrequisitos

- AWS CLI
- AWS SAM CLI
- Node.js
- cliente PostgreSQL (`psql`)
- credenciales AWS configuradas localmente

Validaciones:

```powershell
aws --version
sam --version
node --version
psql --version
aws sts get-caller-identity
```

### Paso 1. Preparar Aurora PostgreSQL

Ejecutar el script principal de Aurora:

```powershell
psql -f ".\atrox_database\Aurora\run_all.sql"
```

Validar:

```sql
\dt
\df
SELECT current_database();
SELECT * FROM entity LIMIT 10;
```

### Paso 2. Preparar DynamoDB

Crear o validar:

- `atrox-idempotency`
- `atrox-audit`

Validaciones:

```powershell
aws dynamodb list-tables --region us-east-2
aws dynamodb describe-table --table-name atrox-idempotency --region us-east-2
aws dynamodb describe-table --table-name atrox-audit --region us-east-2
```

### Paso 3. Desplegar servicios cross

Desplegar:

- `atrox_cross_audit_api`
- `atrox_cross_idempotency_api`

Después del despliegue, obtener:

- URL de la cola de auditoría
- ARN de la cola de auditoría
- URL del API de idempotencia

Comandos útiles:

```powershell
aws sqs get-queue-url --queue-name atrox-cross-audit-queue --region us-east-2
aws sqs get-queue-attributes --queue-url "QUEUE_URL" --attribute-names QueueArn --region us-east-2
aws sns list-topics --region us-east-2
```

### Paso 4. Preparar infraestructura compartida de entity

Desplegar el stack:

- `atrox_entity_api/infrastructure`

Este stack resuelve:

- reuse/creación del security group de Lambda
- soporte de acceso al RDS
- reuse del endpoint SQS

Ejemplo:

```powershell
cd .\atrox_entity_api\infrastructure
sam validate -t template.yaml
sam build -t template.yaml
sam deploy --stack-name atrox-entity-infrastructure --region us-east-2 --capabilities CAPABILITY_IAM --parameter-overrides VpcId=vpc-XXXXXXXX SubnetIds=subnet-AAA,subnet-BBB RdsSecurityGroupId=sg-RDS ExistingLambdaSecurityGroupId=sg-LAMBDA ExistingSqsVpcEndpointId=vpce-SQS
```

### Paso 5. Configurar NAT y tabla de rutas

Para `update` y `delete`, las Lambdas privadas necesitan salida a internet para llamar al API público de idempotencia.

Se requiere:

- NAT Gateway
- tabla de rutas privada
- `0.0.0.0/0 -> nat-...`
- asociación de las subnets de Lambda a esa tabla

### Paso 6. Desplegar servicios entity

Para cada servicio:

```powershell
cd .\atrox_entity_api\NOMBRE_SERVICIO
sam validate -t template.yaml
sam build -t template.yaml
sam deploy --guided
```

Parámetros principales:

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

Parámetros adicionales para `update` y `delete`:

- `IdempotencyApiUrl`
- `IdempotencyRequestIdHeader=x-idempotency-key`

### Paso 7. Desplegar Api Gateway

```powershell
cd .\atrox_entity_api\atrox_api_gateway
sam validate -t template.yaml
sam build -t template.yaml
sam deploy --guided
```

Valores recomendados:

- `Stack Name`: `atrox-entity-unified-gateway`
- `AWS Region`: `us-east-2`
- `StageName`: `atrox`

## 9. Ejemplos de consumo de API

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

Todos:

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/list" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{}"
```

Solo activos:

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/list" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{""status"":1}"
```

Solo eliminados:

```powershell
curl.exe -i -X POST "https://TU_API_ID.execute-api.us-east-2.amazonaws.com/atrox/entity/list" -H "Content-Type: application/json" -H "x-api-key: TU_API_KEY" --data-raw "{""status"":0}"
```

## 10. Comandos útiles de validación

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

## 11. Decisiones principales de diseño

- Lambda independiente por acción en lugar de un CRUD monolítico
- opción de API Gateway unificado para simplificar el consumo
- auditoría como responsabilidad asíncrona mediante SQS
- idempotencia como servicio separado y reutilizable
- arquitectura por capas para mantenibilidad
- diseño sobre VPC para acceso seguro hacia Aurora

## 12. Notas importantes

- `delete` es eliminación lógica
- `list` soporta filtro opcional por `status`
- `update` y `delete` requieren `x-idempotency-key`
- el Api Gateway usa una sola API key y un solo usage plan

## 13. Que permite este proyecto

Demuestra mucho más que un CRUD básico. Permite mostrar:

- arquitectura serverless en AWS
- despliegue cloud con SAM
- resolución real de problemas de red
- seguridad y control de consumo vía API Gateway
- integración asíncrona
- separación de responsabilidades por servicio
