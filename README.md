# TermoConversor

Aplicación web educativa para convertir temperaturas entre **Celsius (°C)**, **Kelvin (K)**, **Fahrenheit (°F)** y **Rankine (°R)**.

Está hecha solo con HTML5, CSS3 y JavaScript puro. No necesita servidor, base de datos, frameworks ni instalaciones.

## Archivos

Todos los archivos van en la misma carpeta (sin subcarpetas):

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos, modo claro/oscuro y diseño responsive |
| `script.js` | Conversiones, validaciones, historial y demás funciones |
| `README.md` | Este documento |

## Funcionalidades

- Conversión entre las cuatro escalas, incluso cuando origen y destino son iguales.
- Conversión automática mientras se escribe (se puede desactivar) y botón **Convertir**.
- Botones para intercambiar escalas, limpiar y copiar el resultado.
- Validación de entrada y bloqueo de valores por debajo del cero absoluto (0 K, -273.15 °C, -459.67 °F, 0 °R).
- Número de decimales configurable (0 a 4; por defecto 2).
- Fórmula utilizada y sustitución con el valor ingresado.
- Termómetro y colores según la temperatura: frío (< 10 °C), templado (10–30 °C) y caliente (> 30 °C).
- Equivalencias del valor en las cuatro escalas.
- Historial de las últimas 10 conversiones de la sesión.
- Modo claro y oscuro, navegación con teclado y etiquetas accesibles.
- Sección educativa sobre cada escala, el cero absoluto y un ejemplo práctico.

**Atajos de teclado:** `Tab` para moverse entre controles, `Enter` para convertir y `Esc` (en el campo de temperatura) para limpiar.

## 1. Abrir la aplicación localmente

1. Descomprime el archivo ZIP.
2. Abre la carpeta y haz doble clic en `index.html`.
3. La aplicación se abre en el navegador (Chrome, Edge, Firefox o Safari).

No necesita internet ni instalar nada.

## 2. Subir los archivos a GitHub

1. Entra a [github.com](https://github.com) e inicia sesión (o crea una cuenta).
2. Haz clic en **New** (o en **+ → New repository**).
3. Escribe un nombre, por ejemplo `termoconversor`, marca **Public** y haz clic en **Create repository**.
4. En la página del repositorio, haz clic en **uploading an existing file** (o **Add file → Upload files**).
5. Arrastra los cuatro archivos (`index.html`, `styles.css`, `script.js`, `README.md`). Sube los archivos, no la carpeta.
6. Haz clic en **Commit changes**.

## 3. Activar GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. En **Branch**, elige `main` y la carpeta `/ (root)`. Haz clic en **Save**.
4. Espera uno o dos minutos y recarga la página. Aparecerá el enlace público, con este formato:

   `https://TU-USUARIO.github.io/termoconversor/`

Todas las rutas entre archivos son relativas, así que la aplicación funciona igual en local y en GitHub Pages.

## Fórmulas utilizadas

La aplicación convierte primero el valor a Celsius y después a la escala de destino.

| Conversión | Fórmula |
|---|---|
| Celsius → Kelvin | K = °C + 273.15 |
| Kelvin → Celsius | °C = K − 273.15 |
| Celsius → Fahrenheit | °F = (°C × 9/5) + 32 |
| Fahrenheit → Celsius | °C = (°F − 32) × 5/9 |
| Celsius → Rankine | °R = (°C + 273.15) × 9/5 |
| Rankine → Celsius | °C = (°R × 5/9) − 273.15 |
| Kelvin → Rankine | °R = K × 9/5 |
| Rankine → Kelvin | K = °R × 5/9 |
| Kelvin → Fahrenheit | °F = (K × 9/5) − 459.67 |
| Fahrenheit → Kelvin | K = (°F + 459.67) × 5/9 |
| Fahrenheit → Rankine | °R = °F + 459.67 |
| Rankine → Fahrenheit | °F = °R − 459.67 |

## Notas

- El historial se conserva mientras la pestaña esté abierta y se borra al cerrarla.
- La preferencia de tema (claro u oscuro) se recuerda en el navegador.
- Al copiar desde un archivo abierto localmente, algunos navegadores restringen el portapapeles. En ese caso la app usa un método alternativo. En GitHub Pages (HTTPS) funciona sin restricciones.
