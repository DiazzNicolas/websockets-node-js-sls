utils/
│
├─ db.js
│  ├─ getItem()              → Obtiene un registro de DynamoDB por su clave.
│  ├─ putItem()              → Inserta o reemplaza un registro en la tabla.
│  ├─ updateItem()           → Actualiza campos específicos de un registro.
│  ├─ deleteItem()           → Elimina un registro de la base de datos.
│  ├─ queryItems()           → Realiza consultas usando índices o filtros.
│  ├─ scanItems()            → Escanea toda una tabla.
│  └─ getCurrentTimestamp()  → Devuelve la hora actual en formato UNIX.
│
├─ constants.js
│  ├─ TABLES                 → Nombres de las tablas DynamoDB (usuarios, salas, preguntas, etc.).
│  ├─ GAME_STATUS            → Estados posibles del juego (esperando, jugando, finalizado).
│  ├─ EVENTS                 → Tipos de eventos WebSocket (joinRoom, newMessage, startGame...).
│  ├─ ERRORS                 → Mensajes estándar de error.
│  └─ CONFIG                 → Parámetros globales (TTL, límites, regiones, etc.).
│
├─ response.js
│  ├─ success(data)          → Devuelve una respuesta HTTP exitosa (200).
│  ├─ error(message, code)   → Devuelve un error HTTP con código personalizado.
│  ├─ notFound(message)      → Respuesta 404 estándar.
│  └─ withErrorHandling(fn)  → Envuelve funciones async con manejo automático de errores.
│
├─ validators.js
│  ├─ validateBody(schema)   → Valida que el cuerpo del request cumpla con una estructura esperada.
│  ├─ validateUser(data)     → Comprueba que un usuario tenga todos los campos requeridos.
│  ├─ validateRoom(data)     → Verifica los datos de una sala antes de crearla.
│  └─ isEmpty(value)         → Revisa si un valor está vacío o indefinido.
│
├─ websocket.js
│  ├─ sendMessage(connectionId, data)   → Envía un mensaje directo a un cliente conectado.
│  ├─ broadcast(roomId, data)           → Envía un mensaje a todos los clientes de una sala.
│  ├─ disconnectClient(connectionId)    → Cierra la conexión de un cliente.
│  └─ getConnectedClients(roomId)       → Devuelve la lista de conexiones activas en una sala.
│
├─ helpers.js
│  ├─ generateId(prefix)     → Genera un ID único con un prefijo opcional.
│  ├─ sleep(ms)              → Retarda la ejecución de forma asíncrona.
│  ├─ shuffleArray(array)    → Mezcla aleatoriamente los elementos de un arreglo.
│  ├─ formatDate(timestamp)  → Convierte un timestamp a formato legible.
│  └─ pickRandom(array)      → Selecciona un elemento aleatorio de una lista.
│
└─ index.js
   ├─ Exporta todos los módulos anteriores (db, constants, response, validators, websocket, helpers).
   └─ Permite importar todo el paquete desde un solo punto (`import utils from './utils/index.js'`).


usuario/
│
├─ crear.js         → POST /usuario/crear
│  └─ Crea un nuevo usuario con nombre único generado
│
├─ obtener.js       → GET /usuario/{userId}
│  └─ Obtiene los datos de un usuario específico
│
├─ actualizar.js    → PUT /usuario/{userId}
│  └─ Actualiza nombre y/o avatar del usuario
│
└─ README.md        → Documentación de la carpeta


📂 Carpeta: sala/
Gestiona todas las operaciones relacionadas con las salas de juego (lobby).  
Incluye creación, unión, salida, configuración y listado de salas.

│
├─ crear.js
│  🧩 Endpoint: POST /sala/crear
│  ├─ Crea una nueva sala con un usuario como host.
│  ├─ Genera un roomId único y registra al host como primer jugador.
│  ├─ Guarda la sala en DynamoDB (tabla ROOMS_TABLE).
│  ├─ Valida:
│  │   • userId obligatorio y usuario existente  
│  │   • maxJugadores entre 2 y 8  
│  │   • numeroPreguntas ∈ {10, 15, 20}
│  ├─ Devuelve la sala creada (estado "esperando").
│  └─ Usa utils: db.putItem, helpers.generateId, response.success/error.
│
├─ unirse.js
│  🧩 Endpoint: POST /sala/{roomId}/unirse
│  ├─ Permite a un usuario unirse a una sala existente.
│  ├─ Valida:
│  │   • Sala existente y estado “esperando”  
│  │   • Usuario existente  
│  │   • No duplicar jugadores  
│  │   • Sala no llena
│  ├─ Actualiza la lista de jugadores en la base de datos.
│  └─ Usa utils: db.getItem, db.updateItem, response.success/error.
│
├─ salir.js
│  🧩 Endpoint: POST /sala/{roomId}/salir
│  ├─ Permite a un jugador abandonar una sala.
│  ├─ Si el host se va → asigna un nuevo host (primer jugador restante).  
│  ├─ Si la sala queda vacía → se elimina automáticamente.
│  ├─ Devuelve mensaje y estado actualizado de la sala.
│  └─ Usa utils: db.getItem, db.updateItem, db.deleteItem, response.success/error.
│
├─ listar.js
│  🧩 Endpoint: GET /salas/disponibles
│  ├─ Lista las salas disponibles (estado "esperando" y no llenas).
│  ├─ Soporta paginación con `limit` y `lastKey`.
│  ├─ Usa índice GSI EstadoCreatedAtIndex (orden por fecha descendente).
│  ├─ Devuelve resumen de salas disponibles.
│  └─ Usa utils: db.queryItems, response.success.
│
├─ obtener.js
│  🧩 Endpoint: GET /sala/{roomId}
│  ├─ Obtiene los detalles completos de una sala específica.
│  ├─ Valida que la sala exista.
│  └─ Usa utils: db.getItem, response.success/error.
│
├─ actualizarConfig.js
│  🧩 Endpoint: PUT /sala/{roomId}/configuracion
│  ├─ Permite al host modificar la configuración de la sala.
│  ├─ Valida:
│  │   • Solo el host puede modificar  
│  │   • Sala debe estar en estado “esperando”  
│  │   • numeroPreguntas ∈ {10, 15, 20}  
│  │   • tiempos entre 30 y 300 segundos  
│  │   • puntosAdivinanzaCorrecta > 0
│  ├─ Actualiza la configuración en DynamoDB.
│  └─ Usa utils: db.updateItem, response.success/error.
│

1. Iniciar Partida    → POST /juego/{roomId}/iniciar
2. Iniciar Ronda      → POST /juego/{sessionId}/ronda
3. Responder Pregunta → POST /juego/{sessionId}/responder
4. Finalizar Respuestas → POST /juego/{sessionId}/fase-respuestas/finalizar
5. Enviar Adivinanzas → POST /juego/{sessionId}/adivinar
6. Finalizar Adivinanzas → POST /juego/{sessionId}/fase-adivinanzas/finalizar
7. Repetir pasos 2-6 hasta completar todas las rondas
8. Finalizar Partida  → POST /juego/{sessionId}/finalizar

✅ usuario/           → 3 archivos (crear, obtener, actualizar)
✅ sala/              → 6 archivos (crear, unirse, salir, listar, obtener, config)
✅ pregunta/          → 5 archivos (crear, listar, listarPorTopic, listarTopics, eliminar)
✅ juego/             → 9 archivos (toda la mecánica del juego)
✅ websocket/         → 4 archivos (tiempo real)
✅ utils/             → Helpers completos (db, websocket, response, etc.)
✅ Documentación      → READMEs en cada carpeta + guía de integración

# 📂 Carpeta: websocket/

Gestiona la comunicación en tiempo real entre el servidor y los clientes usando AWS API Gateway WebSocket.

---

## 🔌 Conexión WebSocket

**URL de conexión:**
```
wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev?roomId=room-xxx&userId=user-xxx
```

**Parámetros obligatorios:**
- `roomId`: ID de la sala a la que se conecta
- `userId`: ID del usuario que se conecta

---

## 📄 Handlers

### **connect.js**
- **Ruta**: `$connect`
- **Descripción**: Se ejecuta automáticamente cuando un cliente se conecta
- **Función**:
  - Registra la conexión en `CONNECTIONS_TABLE`
  - Asocia connectionId con roomId y userId
  - Establece TTL de 3 horas
- **Ejemplo de conexión (JavaScript)**:
  ```javascript
  const ws = new WebSocket(
    'wss://abc123.execute-api.us-east-1.amazonaws.com/dev?roomId=room-xyz&userId=user-123'
  );
  
  ws.onopen = () => {
    console.log('Conectado al WebSocket');
  };
  ```

---

### **disconnect.js**
- **Ruta**: `$disconnect`
- **Descripción**: Se ejecuta cuando un cliente se desconecta
- **Función**:
  - Elimina la conexión de `CONNECTIONS_TABLE`
  - Marca al jugador como desconectado en la sala
  - Limpia recursos asociados
- **Se ejecuta automáticamente** cuando:
  - El cliente cierra la conexión
  - Se pierde la conexión
  - El servidor cierra la conexión

---

### **default.js**
- **Ruta**: `$default`
- **Descripción**: Maneja mensajes que no coinciden con rutas específicas
- **Uso**: Mensajes genéricos o debug
- **Ejemplo**:
  ```javascript
  ws.send(JSON.stringify({
    action: 'ping',
    data: { message: 'hello' }
  }));
  ```

---

### **gameEvent.js**
- **Ruta**: `gameEvent`
- **Descripción**: Maneja eventos del juego y hace broadcast a la sala
- **Estructura del mensaje**:
  ```javascript
  {
    "action": "gameEvent",
    "data": {
      "roomId": "room-xxx",
      "event": "playerAnswered",
      "payload": {
        "userId": "user-123",
        "userName": "Juan"
      }
    }
  }
  ```

---

## 🎮 Eventos del Juego Soportados

### **playerJoined**
Un jugador se unió a la sala
```javascript
{
  event: 'playerJoined',
  data: {
    roomId: 'room-xxx',
    userId: 'user-123',
    userName: 'Juan',
    avatarUrl: '...',
    totalJugadores: 3
  }
}
```

### **playerLeft**
Un jugador salió de la sala
```javascript
{
  event: 'playerLeft',
  data: {
    roomId: 'room-xxx',
    userId: 'user-123',
    userName: 'Juan',
    totalJugadores: 2
  }
}
```

### **gameStarted**
La partida comenzó
```javascript
{
  event: 'gameStarted',
  data: {
    roomId: 'room-xxx',
    sessionId: 'session-abc',
    totalRondas: 10,
    topic: 'cultura-general'
  }
}
```

### **roundStarted**
Nueva ronda iniciada
```javascript
{
  event: 'roundStarted',
  data: {
    sessionId: 'session-abc',
    ronda: 3,
    totalRondas: 10,
    pregunta: {
      questionId: 'q-5',
      texto: '¿Cuál es tu color favorito?',
      opciones: ['Rojo', 'Azul', 'Verde', 'Amarillo']
    }
  }
}
```

### **playerAnswered**
Un jugador respondió (sin revelar la respuesta)
```javascript
{
  event: 'playerAnswered',
  data: {
    sessionId: 'session-abc',
    userId: 'user-123',
    userName: 'Juan',
    progreso: {
      respondidos: 2,
      total: 4
    }
  }
}
```

### **guessPhaseStarted**
Comenzó la fase de adivinanzas
```javascript
{
  event: 'guessPhaseStarted',
  data: {
    sessionId: 'session-abc',
    jugadores: [
      { userId: 'user-1', nombre: 'Juan' },
      { userId: 'user-2', nombre: 'Maria' }
    ]
  }
}
```

### **playerGuessed**
Un jugador adivinó
```javascript
{
  event: 'playerGuessed',
  data: {
    sessionId: 'session-abc',
    userId: 'user-123',
    userName: 'Juan',
    progreso: {
      adivinados: 3,
      total: 4
    }
  }
}
```

### **roundEnded**
Ronda finalizada con resultados
```javascript
{
  event: 'roundEnded',
  data: {
    sessionId: 'session-abc',
    ronda: 3,
    resultados: [
      {
        userId: 'user-1',
        nombre: 'Juan',
        acierto: true,
        puntosGanados: 10
      }
    ],
    ranking: [
      { userId: 'user-1', nombre: 'Juan', puntuacion: 45 }
    ]
  }
}
```

### **gameEnded**
Partida finalizada
```javascript
{
  event: 'gameEnded',
  data: {
    sessionId: 'session-abc',
    ganador: {
      userId: 'user-2',
      nombre: 'Maria',
      puntuacion: 85
    },
    rankingFinal: [...]
  }
}
```

### **chatMessage**
Mensaje de chat
```javascript
{
  event: 'chatMessage',
  data: {
    roomId: 'room-xxx',
    userId: 'user-123',
    userName: 'Juan',
    message: 'Hola a todos!',
    timestamp: '2025-11-12T10:00:00Z'
  }
}
```

---

## 🛠️ Utils WebSocket (utils/websocket.js)

### **sendMessage(connectionId, data)**
Envía mensaje a una conexión específica
```javascript
await sendMessage('abc123', {
  event: 'customEvent',
  data: { message: 'Hola' }
});
```

### **broadcast(roomId, data, excludeUserId?)**
Envía mensaje a todos en una sala
```javascript
await broadcast('room-xyz', {
  event: 'playerJoined',
  data: { userName: 'Juan' }
}, 'user-exclude'); // Opcional: excluir un usuario
```

### **sendToUser(userId, data)**
Envía mensaje a todas las conexiones de un usuario
```javascript
await sendToUser('user-123', {
  event: 'privateMessage',
  data: { message: 'Solo para ti' }
});
```

### **disconnectClient(connectionId)**
Desconecta forzosamente un cliente
```javascript
await disconnectClient('abc123');
```

### **getConnectedClients(roomId)**
Obtiene lista de conexiones activas
```javascript
const conexiones = await getConnectedClients('room-xyz');
// [{ connectionId, userId, roomId, connectedAt }, ...]
```

### **notifyGameEvent(roomId, event, eventData)**
Wrapper para notificar eventos del juego
```javascript
await notifyGameEvent('room-xyz', 'roundStarted', {
  ronda: 3,
  pregunta: {...}
});
```

---

## 🔄 Integración con Endpoints REST

Los endpoints REST deben usar los helpers de WebSocket para notificar eventos:

### Ejemplo: Al iniciar una ronda
```javascript
// En juego/iniciarRonda.js
import { notifyGameEvent } from '../utils/websocket.js';

// ... lógica de iniciar ronda ...

// Notificar a todos los jugadores
await notifyGameEvent(sesion.roomId, 'roundStarted', {
  sessionId,
  ronda: siguienteRonda,
  totalRondas: sesion.preguntasIds.length,
  pregunta: {
    questionId: pregunta.questionId,
    texto: pregunta.texto,
    opciones: pregunta.opciones
  }
});
```

### Ejemplo: Al enviar respuesta
```javascript
// En juego/enviarRespuesta.js
import { broadcast } from '../utils/websocket.js';

// ... guardar respuesta ...

// Notificar a todos (sin revelar la respuesta)
await broadcast(sesion.roomId, {
  event: 'playerAnswered',
  data: {
    userId,
    userName: jugador.nombre,
    progreso: {
      respondidos: jugadoresRespondidos,
      total: totalJugadores
    }
  }
});
```

---

## 📊 Estructura de Conexión en DynamoDB

```javascript
{
  connectionId: "abc123xyz",        // PK
  roomId: "room-xyz",               // GSI RoomIdIndex
  userId: "user-123",               // GSI UserIdIndex
  connectedAt: "2025-11-12T10:00:00Z",
  ttl: 1699876543                   // Expira en 3 horas
}
```

---

## 🧪 Testing WebSocket

### Herramientas recomendadas:
- **Postman**: Soporte para WebSocket
- **wscat**: Cliente CLI de WebSocket
- **Browser DevTools**: Para debug en navegador

### Ejemplo con wscat:
```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c "wss://abc123.execute-api.us-east-1.amazonaws.com/dev?roomId=room-xyz&userId=user-123"

# Enviar mensaje
> {"action":"gameEvent","data":{"roomId":"room-xyz","event":"test"}}

# Desconectar
> Ctrl+C
```

### Ejemplo con JavaScript (Frontend):
```javascript
// Conectar
const ws = new WebSocket(
  'wss://abc123.execute-api.us-east-1.amazonaws.com/dev?roomId=room-xyz&userId=user-123'
);

// Escuchar mensajes
ws.onmessage = (event) => {
  const mensaje = JSON.parse(event.data);
  console.log('Evento recibido:', mensaje.event, mensaje.data);
  
  // Manejar eventos
  switch (mensaje.event) {
    case 'roundStarted':
      mostrarNuevaPregunta(mensaje.data.pregunta);
      break;
    case 'playerAnswered':
      actualizarProgreso(mensaje.data.progreso);
      break;
    case 'roundEnded':
      mostrarResultados(mensaje.data.resultados);
      break;
  }
};

// Manejar errores
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Manejar cierre
ws.onclose = () => {
  console.log('WebSocket cerrado');
};
```

---

## 📝 Notas Importantes

1. **Autenticación**: Los parámetros roomId y userId son obligatorios al conectar
2. **TTL**: Las conexiones expiran automáticamente en 3 horas
3. **Reconexión**: El frontend debe implementar lógica de reconexión automática
4. **Limpieza**: Las conexiones obsoletas (410) se eliminan automáticamente
5. **Broadcast**: Todos los eventos del juego se envían a todos los jugadores de la sala
6. **Estado**: Usa GET /juego/{sessionId}/estado para sincronizar estado después de reconectar

---

## 🚀 Próximos Pasos

Para usar WebSocket en producción:
1. Implementar autenticación con JWT
2. Agregar rate limiting
3. Implementar heartbeat/ping-pong
4. Agregar compresión de mensajes
5. Implementar sistema de presencia (online/offline)
6. Agregar métricas y monitoring