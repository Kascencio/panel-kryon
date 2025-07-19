# Manual de Usuario - Simulador de Cabina AQ
## Terapia Cuántica Bioenergética

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Interfaz de Usuario](#interfaz-de-usuario)
5. [Gestión de Archivos Multimedia](#gestión-de-archivos-multimedia)
6. [Tipos de Terapias](#tipos-de-terapias)
7. [Configuración de Sesiones](#configuración-de-sesiones)
8. [Pantallas Externas](#pantallas-externas)
9. [Conexión Arduino](#conexión-arduino)
10. [Solución de Problemas](#solución-de-problemas)
11. [Preguntas Frecuentes](#preguntas-frecuentes)
12. [Soporte Técnico](#soporte-técnico)

---

## Introducción

El Simulador de Cabina AQ es una aplicación web avanzada diseñada para administrar terapias cuánticas bioenergéticas. La aplicación combina:

- **Cromoterapia**: Luces LED RGB controladas por Arduino
- **Audioterapia**: Reproducción de frecuencias específicas
- **Videoterapia**: Contenido visual terapéutico
- **Simulación 3D**: Visualización inmersiva de la cabina
- **Pantallas múltiples**: Soporte para dispositivos externos

### Beneficios Principales
- ✅ Reducción del estrés y la tensión
- ✅ Equilibrio energético
- ✅ Mejora del bienestar general
- ✅ Armonización física y emocional

---

## Requisitos del Sistema

### Navegador Web
- **Chrome**: Versión 90 o superior (Recomendado)
- **Firefox**: Versión 88 o superior
- **Safari**: Versión 14 o superior
- **Edge**: Versión 90 o superior

### Hardware Mínimo
- **RAM**: 4 GB mínimo, 8 GB recomendado
- **Procesador**: Intel i5 o AMD Ryzen 5 equivalente
- **Tarjeta Gráfica**: Soporte WebGL 2.0
- **Conexión**: USB para Arduino (opcional)

### Permisos del Navegador
- ✅ Ventanas emergentes (pop-ups)
- ✅ Reproducción automática de audio/video
- ✅ Acceso al micrófono (opcional)
- ✅ Acceso a puerto serie (para Arduino)

---

## Instalación y Configuración

### 1. Descarga e Instalación
\`\`\`bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/cabina-aq.git

# Instalar dependencias
cd cabina-aq
npm install

# Iniciar la aplicación
npm run dev
\`\`\`

### 2. Configuración Inicial
1. Abrir navegador en `http://localhost:3000`
2. Permitir ventanas emergentes cuando se solicite
3. Configurar permisos de audio/video si es necesario

### 3. Estructura de Directorios
\`\`\`
cabina-aq/
├── public/
│   ├── audio/           # Archivos de audio
│   │   ├── flac/        # Audio alta calidad
│   │   ├── backup/      # Archivos de respaldo
│   │   └── alternative/ # Archivos alternativos
│   ├── video/           # Archivos de video
│   │   ├── backup/      # Videos de respaldo
│   │   └── alternative/ # Videos alternativos
│   └── images/          # Imágenes y recursos
├── components/          # Componentes React
├── docs/               # Documentación
└── README.md
\`\`\`

---

## Interfaz de Usuario

### Pantalla Principal

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Simulador de Cabina AQ                  │
│                 Terapia Cuántica Bioenergética             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │                     │  │                             │   │
│  │   Simulación 3D     │  │      Panel de Control       │   │
│  │   (Minimizada)      │  │                             │   │
│  │                     │  │  • Selección de Terapia     │   │
│  │  [Ver 3D] [Config]  │  │  • Duración de Sesión       │   │
│  │                     │  │  • Control de Intensidad    │   │
│  │  Estado: En Espera  │  │  • Conexión Arduino         │   │
│  │  Terapia: Ninguna   │  │                             │   │
│  │                     │  │  [Iniciar Sesión]           │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Pantallas Externas                         │
│  │  [Monitor] [TV] [Móvil] [Laptop]                       │
│  │  💡 Las ventanas se abren automáticamente               │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────────┤
│  │                 Terapias Básicas                        │
│  │  [General] [Cascada] [Pausado] [Intermitente]          │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────────┤
│  │                Terapias de Color                        │
│  │     [Rojo]      [Verde]      [Azul]                    │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────────┤
│  │               Terapias Avanzadas                        │
│  │  [Biomagnética] [Fotónica] [Neurocuántica]             │
│  │  [Bioresonancia] [Atómica] [Fitocuántica]              │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Elementos de la Interfaz

#### 1. **Simulación 3D**
- **Vista Minimizada**: Información básica y controles
- **Vista Expandida**: Simulación 3D completa con Three.js
- **Controles de Calidad**: Baja, Media, Alta

#### 2. **Panel de Control**
- **Selector de Terapia**: Dropdown con todas las opciones
- **Duración**: 4, 10, 15 minutos
- **Intensidad**: 0-100% (control deslizante)
- **Modo**: Automático o manual

#### 3. **Reproductor Multimedia**
- **Audio**: Controles de volumen, repetición
- **Video**: Solo para Terapia Cascada
- **Micrófono**: Activación opcional durante sesión

---

## Gestión de Archivos Multimedia

### Estructura de Archivos de Audio

#### Ubicación Principal
\`\`\`
public/audio/
├── [terapia]-[duración]min.[formato]
├── general-4min.mp3
├── general-15min.mp3
├── cascada-4min.mp3
├── cascada-15min.mp3
└── ...
\`\`\`

#### Formatos Soportados (en orden de prioridad)
1. **FLAC** (Alta fidelidad) - `public/audio/flac/`
2. **WAV** (Alta calidad)
3. **OGG** (Compresión eficiente)
4. **MP3** (Estándar)

#### Convenciones de Nomenclatura
\`\`\`
[frecuencia]-[duración]min.[extensión]

Ejemplos:
- general-4min.mp3
- cascada-15min.flac
- intermitente-10min.ogg
- rojo-4min.wav
\`\`\`

### Estructura de Archivos de Video

#### Ubicación Principal
\`\`\`
public/video/
├── [terapia]-[duración]min.[formato]
├── cascada-4min.mp4      # Solo Terapia Cascada tiene video
├── cascada-15min.mp4
└── cascada-10min.mp4
\`\`\`

#### Formatos Soportados
1. **MP4** (Recomendado)
2. **WebM** (Navegadores modernos)
3. **OGG** (Alternativo)

### Cómo Agregar Nuevos Archivos

#### Paso 1: Preparar Archivos
\`\`\`bash
# Estructura requerida para audio
public/audio/
├── nueva-terapia-4min.mp3
├── nueva-terapia-15min.mp3
└── nueva-terapia-10min.mp3

# Para alta calidad (opcional)
public/audio/flac/
├── nueva-terapia-4min.flac
├── nueva-terapia-15min.flac
└── nueva-terapia-10min.flac
\`\`\`

#### Paso 2: Configurar Terapia
\`\`\`typescript
// En components/more-therapies.tsx o similar
{
  id: "nueva-terapia",
  name: "Nueva Terapia",
  description: "Descripción de la nueva terapia",
  frequency: "nueva-terapia",  // Debe coincidir con nombre archivo
  color: "#10b981",
  icon: <Atom className="h-4 w-4" />,
  intensity: "Media",
  hasVideo: false,  // true si tiene video
}
\`\`\`

#### Paso 3: Archivos de Respaldo (Opcional)
\`\`\`
public/audio/backup/
├── nueva-terapia-4min.mp3
└── ...

public/audio/alternative/
├── nueva-terapia-4min.mp3
└── ...
\`\`\`

### Especificaciones Técnicas

#### Audio
- **Tasa de bits**: 320 kbps (MP3), 1411 kbps (FLAC)
- **Frecuencia de muestreo**: 44.1 kHz
- **Canales**: Estéreo
- **Duración**: Exacta según configuración (4, 10, 15 min)

#### Video (Solo Terapia Cascada)
- **Resolución**: 1920x1080 (Full HD)
- **Tasa de bits**: 3000 kbps
- **Codec**: H.264 (MP4)
- **Audio**: AAC, 128 kbps

---

## Tipos de Terapias

### Terapias Básicas

#### 1. **Terapia General**
- **Archivo**: `general-[duración]min.mp3`
- **Descripción**: Sesión equilibrada con patrones de luz variados
- **Intensidad**: Media
- **Modo Arduino**: `patron`
- **Video**: No

#### 2. **Terapia Cascada** 🎬
- **Archivo**: `cascada-[duración]min.mp4` (¡Único con video!)
- **Descripción**: Efecto cascada relajante con transiciones suaves
- **Intensidad**: Suave
- **Modo Arduino**: `cascada`
- **Video**: Sí (se abre ventana automáticamente)

#### 3. **Terapia Pausada**
- **Archivo**: `pausado-[duración]min.mp3`
- **Descripción**: Cambios lentos y pausados para relajación profunda
- **Intensidad**: Baja
- **Modo Arduino**: `pausado`
- **Video**: No

#### 4. **Terapia Intermitente**
- **Archivo**: `intermitente-[duración]min.mp3`
- **Descripción**: Pulsos rápidos para estimulación y energía
- **Intensidad**: Alta
- **Modo Arduino**: `intermitente`
- **Video**: No

### Terapias de Color

#### 1. **Terapia Roja**
- **Archivo**: `rojo-[duración]min.mp3`
- **Descripción**: Estimulación y energía vital
- **Color LED**: Rojo puro (#FF0000)
- **Modo Arduino**: `rojo`

#### 2. **Terapia Verde**
- **Archivo**: `verde-[duración]min.mp3`
- **Descripción**: Equilibrio y armonía natural
- **Color LED**: Verde puro (#00FF00)
- **Modo Arduino**: `verde`

#### 3. **Terapia Azul**
- **Archivo**: `azul-[duración]min.mp3`
- **Descripción**: Calma y relajación profunda
- **Color LED**: Azul puro (#0000FF)
- **Modo Arduino**: `azul`

### Terapias Avanzadas

#### Biomagnética, Fotónica, Neurocuántica, etc.
- **Archivos**: `[nombre]-[duración]min.mp3`
- **Modo Arduino**: `patron` (por defecto)
- **Personalización**: Disponible en configuración avanzada

---

## Configuración de Sesiones

### Paso a Paso: Iniciar una Sesión

#### 1. **Seleccionar Terapia**
\`\`\`
┌─────────────────────────────────────┐
│  Selector de Terapia                │
│  ┌─────────────────────────────────┐ │
│  │ [Dropdown] Terapia General    ▼ │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ✅ Terapia seleccionada            │
│  📊 Información mostrada            │
└─────────────────────────────────────┘
\`\`\`

#### 2. **Configurar Duración**
\`\`\`
┌─────────────────────────────────────┐
│  Duración de Sesión                 │
│  ┌─────┐ ┌─────┐ ┌─────┐            │
│  │ 4min│ │10min│ │15min│            │
│  │  ○  │ │  ●  │ │  ○  │            │
│  └─────┘ └─────┘ └─────┘            │
│                                     │
│  ✅ 10 minutos seleccionados        │
└─────────────────────────────────────┘
\`\`\`

#### 3. **Ajustar Intensidad**
\`\`\`
┌─────────────────────────────────────┐
│  Intensidad de Luces                │
│  ┌─────────────────────────────────┐ │
│  │ ●────────────○─────────────────  │ │
│  │ 0%          80%              100%│ │
│  └─────────────────────────────────┘ │
│                                     │
│  💡 80% configurado                 │
└─────────────────────────────────────┘
\`\`\`

#### 4. **Iniciar Sesión**
\`\`\`
┌─────────────────────────────────────┐
│  ┌─────────────────────────────────┐ │
│  │     [▶ Iniciar Sesión]          │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ⏱️  Sesión iniciada                │
│  🎵 Audio reproduciéndose           │
│  💡 LEDs activados                  │
│  📺 Video en pantalla externa       │
└─────────────────────────────────────┘
\`\`\`

### Controles Durante la Sesión

#### Panel de Control Activo
\`\`\`
┌─────────────────────────────────────┐
│  Sesión Activa - 10:00 restantes    │
│  ┌─────────────────────────────────┐ │
│  │  🎵 Volumen Música    [●──────]  │ │
│  │  🎤 Micrófono        [Activar]  │ │
│  │  💡 Intensidad LEDs  [●──────]  │ │
│  │                                 │ │
│  │     [⏸️ Detener Sesión]          │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
\`\`\`

### Finalización Automática

La sesión termina automáticamente cuando:
- ⏰ Se cumple el tiempo configurado
- 🎵 Termina el audio (si no está en repetición)
- 🎬 Termina el video (si no está en repetición)
- 🛑 El usuario detiene manualmente

---

## Pantallas Externas

### Configuración de Múltiples Pantallas

#### Tipos de Pantalla Disponibles
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                Pantallas Externas                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Monitor │ │   TV    │ │  Móvil  │ │ Laptop  │      │
│  │ 1920x   │ │ 1280x   │ │  375x   │ │ 1366x   │      │
│  │ 1080    │ │  720    │ │  667    │ │  768    │      │
│  │   💻    │ │   📺    │ │   📱    │ │   💻    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────────────────┘
\`\`\`

#### Comportamiento por Tipo de Terapia

##### Terapias con Video (Solo Cascada)
\`\`\`
┌─────────────────────────────────────┐
│  Terapia Cascada Seleccionada       │
│  ┌─────────────────────────────────┐ │
│  │  🎬 Video disponible            │ │
│  │  📺 Ventana TV abierta auto     │ │
│  │  ▶️  Reproducción automática     │ │
│  │  🔄 Controles de repetición     │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
\`\`\`

##### Terapias Solo Audio
\`\`\`
┌─────────────────────────────────────┐
│  Otras Terapias                     │
│  ┌─────────────────────────────────┐ │
│  │  🎵 Solo audio                  │ │
│  │  ⚫ Pantalla negra               │ │
│  │  ℹ️  Información de terapia      │ │
│  │  🔇 Sin contenido visual        │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
\`\`\`

### Gestión de Ventanas

#### Abrir Ventana Externa
1. **Seleccionar tipo de pantalla** (Monitor, TV, Móvil, Laptop)
2. **Permitir ventanas emergentes** en el navegador
3. **La ventana se abre automáticamente** con el contenido apropiado
4. **Sincronización automática** con la sesión principal

#### Controles de Ventana
\`\`\`
┌─────────────────────────────────────┐
│  Ventana Externa - TV               │
│  ┌─────────────────────────────────┐ │
│  │  📺 Televisión                  │ │
│  │  🟢 Video (Cascada activa)      │ │
│  │  [👁️ Enfocar] [❌ Cerrar]        │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
\`\`\`

### Solución de Problemas - Pantallas

#### Ventanas No Se Abren
\`\`\`
❌ Problema: Las ventanas externas no se abren

✅ Soluciones:
1. Permitir ventanas emergentes (pop-ups)
   - Chrome: Configuración > Privacidad > Ventanas emergentes
   - Firefox: Preferencias > Privacidad > Bloquear ventanas emergentes

2. Verificar bloqueadores de anuncios
   - Desactivar temporalmente
   - Agregar excepción para localhost

3. Reiniciar navegador
   - Cerrar todas las pestañas
   - Abrir nueva sesión
\`\`\`

#### Contenido No Se Sincroniza
\`\`\`
❌ Problema: Las ventanas no muestran el contenido correcto

✅ Soluciones:
1. Recargar ventana externa (F5)
2. Cerrar y reabrir ventana
3. Verificar conexión de red
4. Comprobar archivos multimedia
\`\`\`

---

## Conexión Arduino

### Hardware Requerido

#### Componentes
- **Arduino Uno/Nano**: Microcontrolador principal
- **Tira LED NeoPixel**: 24 LEDs WS2812B
- **Resistencia**: 470Ω (para protección)
- **Capacitor**: 1000µF (estabilización)
- **Cable USB**: Para conexión con PC

#### Esquema de Conexión
\`\`\`
Arduino Uno          NeoPixel Strip
┌─────────────┐     ┌──────────────┐
│             │     │              │
│    PIN 6 ───┼─────┼─── DIN       │
│    5V   ────┼─────┼─── VCC       │
│    GND  ────┼─────┼─── GND       │
│             │     │              │
└─────────────┘     └──────────────┘
\`\`\`

### Configuración del Arduino

#### Código Arduino (Sketch)
\`\`\`cpp
#include <Adafruit_NeoPixel.h>

#define LED_PIN 6
#define LED_COUNT 24

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(9600);
  strip.begin();
  strip.show();
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readString();
    command.trim();
    
    // Procesar comandos desde la aplicación
    if (command.startsWith("inicio:")) {
      // Iniciar terapia
      processTherapyCommand(command);
    } else if (command == "stop") {
      // Detener terapia
      clearLEDs();
    } else if (command.startsWith("test:")) {
      // Modo prueba
      processTestCommand(command);
    }
  }
}
\`\`\`

### Conexión desde la Aplicación

#### Paso 1: Habilitar Web Serial API
\`\`\`javascript
// La aplicación usa Web Serial API
// Requiere navegador compatible (Chrome 89+)
\`\`\`

#### Paso 2: Conectar Arduino
\`\`\`
┌─────────────────────────────────────┐
│  Conexión Arduino                   │
│  ┌─────────────────────────────────┐ │
│  │  🔌 [Conectar Arduino]          │ │
│  │                                 │ │
│  │  Estado: Desconectado           │ │
│  │  Puerto: Seleccionar...         │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Después de conectar:

┌─────────────────────────────────────┐
│  Conexión Arduino                   │
│  ┌─────────────────────────────────┐ │
│  │  ✅ Arduino Conectado           │ │
│  │                                 │ │
│  │  Estado: Conectado              │ │
│  │  Puerto: COM3 (9600 baud)       │ │
│  │  LEDs: 24 NeoPixel              │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
\`\`\`

### Comandos Arduino

#### Protocolo de Comunicación
\`\`\`
Formato: comando:parámetros

Ejemplos:
- inicio:general,patron,15,80
- inicio:cascada,cascada,10,60
- inicio:rojo,rojo,4,100
- test:rojo
- test:verde
- test:azul
- test:blanco
- stop
- completado
\`\`\`

#### Modos Disponibles
1. **patron**: 11 patrones complejos con velocidad variable
2. **intermitente**: Cambio rápido cada 500ms
3. **pausado**: Cambio lento cada 1.5 segundos
4. **cascada**: Efecto cascada LED por LED
5. **rojo**: Todos los LEDs en rojo sólido
6. **verde**: Todos los LEDs en verde sólido
7. **azul**: Todos los LEDs en azul sólido

### Pruebas de LEDs

#### Panel de Pruebas
\`\`\`
┌─────────────────────────────────────┐
│  Pruebas de Color                   │
│  ┌─────────────────────────────────┐ │
│  │  [🔴 Rojo] [🟢 Verde]           │ │
│  │  [🔵 Azul] [⚪ Blanco]          │ │
│  │                                 │ │
│  │  [🔄 Apagar LEDs]               │ │
│  └─────────────────────────────────┘ │
│                                     │
│  💡 Intensidad: 80%                 │
└─────────────────────────────────────┘
\`\`\`

---

## Solución de Problemas

### Problemas de Audio

#### Audio No Se Reproduce
\`\`\`
❌ Problema: No se escucha audio durante la sesión

🔍 Diagnóstico:
1. Verificar volumen del sistema
2. Comprobar volumen de la aplicación
3. Revisar si está silenciado
4. Verificar formato de archivo

✅ Soluciones:
1. Ajustar volumen en controles de la aplicación
2. Verificar que el archivo existe:
   - Ruta: public/audio/[terapia]-[duración]min.mp3
   - Ejemplo: public/audio/general-15min.mp3

3. Comprobar formatos alternativos:
   - FLAC: public/audio/flac/
   - OGG: Formato alternativo
   - WAV: Alta calidad

4. Revisar consola del navegador (F12)
\`\`\`

#### Error de Formato de Audio
\`\`\`
❌ Error: "Audio no disponible para esta configuración"

✅ Soluciones:
1. Verificar nomenclatura de archivos:
   ✅ Correcto: general-15min.mp3
   ❌ Incorrecto: general_15_min.mp3

2. Formatos soportados:
   - MP3: Estándar (320 kbps)
   - FLAC: Alta fidelidad (1411 kbps)
   - OGG: Compresión eficiente
   - WAV: Sin compresión

3. Estructura de directorios:
   public/audio/
   ├── [terapia]-[duración]min.[formato]
   ├── backup/[archivos de respaldo]
   └── alternative/[archivos alternativos]
\`\`\`

### Problemas de Video

#### Video No Se Reproduce (Solo Terapia Cascada)
\`\`\`
❌ Problema: Video no aparece en ventana externa

🔍 Diagnóstico:
1. Solo "Terapia Cascada" tiene video
2. Otras terapias muestran pantalla negra (normal)
3. Verificar archivos de video

✅ Soluciones:
1. Confirmar terapia seleccionada:
   - ✅ Terapia Cascada: Debe mostrar video
   - ✅ Otras terapias: Pantalla negra normal

2. Verificar archivos de video:
   - Ruta: public/video/cascada-[duración]min.mp4
   - Formatos: MP4, WebM, OGG

3. Abrir ventana externa manualmente:
   - Clic en botón "TV" o "Monitor"
   - Permitir ventanas emergentes
\`\`\`

### Problemas de Conexión Arduino

#### Arduino No Se Conecta
\`\`\`
❌ Problema: "Arduino no detectado" o "Error de conexión"

🔍 Diagnóstico:
1. Verificar conexión USB
2. Comprobar drivers
3. Revisar código Arduino
4. Verificar navegador compatible

✅ Soluciones:
1. Hardware:
   - Conectar Arduino via USB
   - Verificar LED de encendido
   - Probar otro cable USB
   - Instalar drivers CH340/FTDI si es necesario

2. Software:
   - Usar Chrome 89+ (Web Serial API)
   - Cargar sketch correcto en Arduino
   - Verificar velocidad: 9600 baud
   - Cerrar Arduino IDE antes de conectar

3. Permisos:
   - Permitir acceso a puerto serie
   - Reiniciar navegador si es necesario
\`\`\`

#### LEDs No Responden
\`\`\`
❌ Problema: Arduino conectado pero LEDs no se encienden

✅ Soluciones:
1. Verificar conexiones:
   - PIN 6 → DIN (NeoPixel)
   - 5V → VCC
   - GND → GND

2. Comprobar alimentación:
   - 24 LEDs requieren suficiente corriente
   - Usar fuente externa si es necesario
   - Verificar capacitor de 1000µF

3. Probar comandos:
   - Usar botones de prueba en la aplicación
   - Verificar respuesta en monitor serie
   - Comprobar sintaxis de comandos
\`\`\`

### Problemas de Rendimiento

#### Simulación 3D Lenta
\`\`\`
❌ Problema: La simulación 3D se ve entrecortada

✅ Soluciones:
1. Ajustar calidad gráfica:
   - Cambiar a "Baja" en configuración
   - Reducir resolución de pantalla
   - Cerrar otras aplicaciones

2. Optimizar navegador:
   - Habilitar aceleración por hardware
   - Actualizar drivers gráficos
   - Usar Chrome para mejor rendimiento

3. Usar vista minimizada:
   - Clic en "Minimizar" simulación
   - Mantiene funcionalidad completa
   - Reduce carga gráfica
\`\`\`

#### Ventanas Externas Lentas
\`\`\`
❌ Problema: Las ventanas externas no responden

✅ Soluciones:
1. Limitar número de ventanas:
   - Máximo 2-3 ventanas simultáneas
   - Cerrar ventanas no utilizadas

2. Optimizar red:
   - Verificar conexión local
   - Reiniciar aplicación si es necesario

3. Recursos del sistema:
   - Cerrar aplicaciones innecesarias
   - Verificar uso de RAM
\`\`\`

---

## Preguntas Frecuentes

### General

**P: ¿Qué navegadores son compatibles?**
R: Chrome 89+, Firefox 88+, Safari 14+, Edge 90+. Chrome es el más recomendado para todas las funciones.

**P: ¿Necesito Arduino para usar la aplicación?**
R: No, la aplicación funciona completamente sin Arduino. El Arduino es opcional para control físico de LEDs.

**P: ¿Puedo usar la aplicación sin conexión a internet?**
R: Sí, una vez descargada, la aplicación funciona localmente. Solo necesita conexión para actualizaciones.

### Terapias

**P: ¿Cuántas terapias están disponibles?**
R: La aplicación incluye:
- 4 Terapias Básicas (General, Cascada, Pausado, Intermitente)
- 3 Terapias de Color (Rojo, Verde, Azul)
- 8 Terapias Avanzadas (Biomagnética, Fotónica, etc.)

**P: ¿Solo la Terapia Cascada tiene video?**
R: Correcto. Solo la Terapia Cascada incluye contenido de video. Todas las demás son solo audio con simulación 3D.

**P: ¿Puedo agregar mis propias terapias?**
R: Sí, siguiendo la estructura de archivos y configuración descrita en este manual.

### Archivos Multimedia

**P: ¿Qué formatos de audio son compatibles?**
R: MP3, FLAC, OGG, WAV. El sistema intenta automáticamente diferentes formatos si uno falla.

**P: ¿Dónde debo colocar los archivos de audio?**
R: En `public/audio/` siguiendo la nomenclatura: `[terapia]-[duración]min.[formato]`

**P: ¿Puedo usar archivos de diferente duración?**
R: Los archivos deben coincidir exactamente con las duraciones configuradas (4, 10, 15 minutos).

### Pantallas Externas

**P: ¿Cuántas pantallas externas puedo usar?**
R: No hay límite técnico, pero se recomienda máximo 3-4 para mejor rendimiento.

**P: ¿Las ventanas externas funcionan en tablets/móviles?**
R: Sí, pero la funcionalidad puede estar limitada. Se recomienda usar en computadoras de escritorio.

**P: ¿Puedo usar la aplicación en múltiples monitores?**
R: Sí, las ventanas externas se pueden mover a diferentes monitores físicos.

### Arduino

**P: ¿Qué modelo de Arduino necesito?**
R: Arduino Uno, Nano, o cualquier compatible con 5V y suficientes pines digitales.

**P: ¿Cuántos LEDs puedo controlar?**
R: El código está configurado para 24 LEDs, pero se puede modificar fácilmente.

**P: ¿Funciona con otros tipos de LEDs?**
R: Está diseñado para NeoPixel (WS2812B), pero se puede adaptar a otros tipos.

---

## Soporte Técnico

### Información del Sistema

Para reportar problemas, incluye:

\`\`\`
Sistema Operativo: Windows 10/11, macOS, Linux
Navegador: Chrome 120.0.6099.109
Versión Aplicación: 1.0.0
Arduino: Conectado/Desconectado
Error específico: [Descripción detallada]
\`\`\`

### Logs de Depuración

#### Abrir Consola del Navegador
1. **Chrome/Edge**: F12 → Console
2. **Firefox**: F12 → Console  
3. **Safari**: Cmd+Option+C

#### Información Útil
\`\`\`javascript
// En la consola del navegador
console.log("Información de depuración:");
console.log("Navigator:", navigator.userAgent);
console.log("WebGL:", !!window.WebGLRenderingContext);
console.log("Web Serial:", !!navigator.serial);
console.log("Media Devices:", !!navigator.mediaDevices);
\`\`\`

### Contacto

- **GitHub Issues**: [Reportar problemas](https://github.com/tu-usuario/cabina-aq/issues)
- **Email**: soporte@cabina-aq.com
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/cabina-aq/wiki)

### Actualizaciones

La aplicación se actualiza automáticamente. Para forzar actualización:

\`\`\`bash
# Actualizar dependencias
npm update

# Limpiar caché
npm run clean

# Reinstalar
npm install
\`\`\`

---

## Índice Alfabético

- **Arduino**: Conexión, Configuración, Troubleshooting
- **Audio**: Formatos, Ubicación, Problemas
- **Cascada**: Única terapia con video
- **Duración**: 4, 10, 15 minutos
- **Formatos**: MP3, FLAC, OGG, WAV, MP4, WebM
- **Intensidad**: Control 0-100%
- **LEDs**: NeoPixel, 24 unidades, PIN 6
- **Micrófono**: Activación opcional
- **Pantallas**: Monitor, TV, Móvil, Laptop
- **Terapias**: Básicas, Color, Avanzadas
- **Video**: Solo Terapia Cascada
- **Web Serial**: API para Arduino

---

*Manual de Usuario v1.0 - Simulador de Cabina AQ*  
*Última actualización: Enero 2024*
\`\`\`

\`\`\`


\`\`\`
