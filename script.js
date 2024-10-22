document.addEventListener('DOMContentLoaded', () => {
    let db;
    let posiblesPersonajes = [];
    let preguntaActual = null;
    let faseAdivinanza = false;
    let nombreAdivinado = '';
    let preguntas = [];
    let tiposAtributos = {};  // Aquí se guardarán los tipos de los atributos nuevos


    const request = indexedDB.open('AdivinaQuienDB', 1);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('personajes', { keyPath: 'nombre' });
    
        const personajesIniciales = [
            {
                nombre: 'Juan',
                caracteristicas: {
                    gafas: { valor: 1, tipo: 'posesion' },
                    'pelo corto': { valor: 0, tipo: 'posesion' },
                    sombrero: { valor: 0, tipo: 'posesion' },
                    'ojos claros': { valor: 1, tipo: 'posesion' },
                    'piel clara': { valor: 1, tipo: 'posesion' },
                    alto: { valor: 0, tipo: 'pertenencia' }
                }
            },
            {
                nombre: 'Maria',
                caracteristicas: {
                    gafas: { valor: 0, tipo: 'posesion' },
                    'pelo corto': { valor: 1, tipo: 'posesion' },
                    sombrero: { valor: 1, tipo: 'posesion' },
                    'ojos claros': { valor: 0, tipo: 'posesion' },
                    'piel clara': { valor: 0, tipo: 'posesion' },
                    alto: { valor: 1, tipo: 'pertenencia' }
                }
            },
            {
                nombre: 'Carlos',
                caracteristicas: {
                    gafas: { valor: 1, tipo: 'posesion' },
                    'pelo corto': { valor: 1, tipo: 'posesion' },
                    sombrero: { valor: 0, tipo: 'posesion' },
                    'ojos claros': { valor: 0, tipo: 'posesion' },
                    'piel clara': { valor: 1, tipo: 'pertenencia' },
                    alto: { valor: 1, tipo: 'pertenencia' }
                }
            }
        ];
    
        personajesIniciales.forEach(personaje => store.add(personaje));
    };
    
    

    request.onsuccess = (event) => {
        db = event.target.result;
        cargarPersonajes();
    };

    function cargarPersonajes() {
        const transaction = db.transaction(['personajes'], 'readonly');
        const request = transaction.objectStore('personajes').getAll();
    
        request.onsuccess = (event) => {
            posiblesPersonajes = event.target.result;
            generarPreguntas();  // Generar las preguntas con los personajes actualizados
            mostrarPreguntaAleatoria();  // Mostrar la primera pregunta
            imprimirTablaPersonajes();  // Imprimir los personajes en la consola
        };
    }
    

    function imprimirTablaPersonajes() {
        const personajesConValoresSimples = posiblesPersonajes.map(personaje => {
            const caracteristicasSimplificadas = Object.fromEntries(
                Object.entries(personaje.caracteristicas).map(([clave, data]) => [
                    clave,
                    data.valor === 1 || data.valor === 'sí' ? 'Sí' : 'No'
                ])
            );
    
            return {
                Nombre: personaje.nombre,
                ...caracteristicasSimplificadas
            };
        });
    
        console.table(personajesConValoresSimples);
    }
    
    
    
    
    

    function generarPreguntas() {
        preguntas = [];
        posiblesPersonajes.forEach(personaje => {
            Object.entries(personaje.caracteristicas).forEach(([clave, data]) => {
                if (!preguntas.some(p => p.clave === clave)) {
                    const tipoPregunta = determinarTipoDePregunta(clave, data.tipo);
                    preguntas.push({
                        texto: tipoPregunta,
                        clave: clave
                    });
                }
            });
        });
    }
    
    

    function mostrarPreguntaAleatoria() {
        if (preguntas.length > 0) {
            const indicePregunta = Math.floor(Math.random() * preguntas.length);
            preguntaActual = preguntas[indicePregunta];
            document.getElementById('pregunta').innerText = preguntaActual.texto;
            preguntas.splice(indicePregunta, 1);
        } else {
            alert('Se han agotado las preguntas.');
            pedirNuevoPersonaje();
        }
    }

    window.manejarRespuesta = function manejarRespuesta(respuesta) {
        if (!preguntaActual) return;
    
        const claveCaracteristica = preguntaActual.clave;
        const valorEsperado = respuesta === '1' ? 1 : 0;  // Capturamos la respuesta como '1' o '0'
    
        // Si estamos en la fase de adivinanza
        if (faseAdivinanza) {
            if (respuesta === '0') {  // Si el usuario dice que no es el personaje
                alert('No encontré coincidencias. Vamos a agregar un nuevo personaje.');
                pedirNuevoPersonaje();  // Mostramos el formulario para agregar un nuevo personaje
                return;
            } else {
                alert(`¡Genial! Has adivinado, es ${nombreAdivinado}.`);
                reiniciarJuego();  // Reiniciamos el juego si la adivinanza es correcta
                return;
            }
        }
    
        // Filtrar personajes comparando con el valor booleano correcto (0 o 1)
        posiblesPersonajes = posiblesPersonajes.filter(personaje => {
            const valorCaracteristica = personaje.caracteristicas[claveCaracteristica]?.valor;
            return valorCaracteristica === valorEsperado;
        });
    
        if (posiblesPersonajes.length === 1) {
            // Si queda un solo personaje, pasamos a la fase de adivinanza
            nombreAdivinado = posiblesPersonajes[0].nombre;
            document.getElementById('pregunta').innerText = `¿Es ${nombreAdivinado} tu personaje?`;
            faseAdivinanza = true;
        } else if (posiblesPersonajes.length === 0) {
            // Si no quedan personajes, pedimos agregar un nuevo personaje
            alert('No encontré coincidencias. Vamos a agregar un nuevo personaje.');
            pedirNuevoPersonaje();
        } else {
            // Continuamos haciendo preguntas
            mostrarPreguntaAleatoria();
        }
    };    
        
    
    
    

    function pedirNuevoPersonaje() {
        document.getElementById('juego-container').classList.add('oculto');
        document.getElementById('nuevo-personaje-form').classList.remove('oculto');
    }

    window.guardarNuevoPersonaje = function guardarNuevoPersonaje() {
        const nombre = document.getElementById('nombre-personaje').value.trim();
        const nuevaCaracteristica = document.getElementById('nueva-caracteristica-input').value.trim().toLowerCase();
        const tipoCaracteristica = document.querySelector('input[name="tipo-caracteristica"]:checked')?.value;
    
        if (!nombre || !nuevaCaracteristica || !tipoCaracteristica) {
            alert('Completa todos los campos.');
            return;
        }
    
        const claveCaracteristica = nuevaCaracteristica.replace(/\s+/g, '_');
    
        // Obtenemos los atributos para el nuevo personaje
        const nuevasCaracteristicas = generarAtributosParaNuevoPersonaje();
    
        // Agregamos la nueva característica con la estructura correcta
        nuevasCaracteristicas[claveCaracteristica] = {
            valor: 1,
            tipo: tipoCaracteristica
        };
    
        const nuevoPersonaje = {
            nombre,
            caracteristicas: nuevasCaracteristicas
        };
    
        agregarPersonajeABaseDatos(nuevoPersonaje)
            .then(() => actualizarPersonajesExistentes(claveCaracteristica, tipoCaracteristica))
            .then(() => {
                alert(`¡El personaje "${nombre}" se ha agregado con éxito!`);
                reiniciarJuego();
            })
            .catch((error) => {
                alert(`Error al agregar el personaje: ${error.message}`);
            });
    };
    
    
    
    
    function generarAtributosParaNuevoPersonaje() {
        let nuevasCaracteristicas = {};
    
        // Obtenemos todos los atributos conocidos desde los personajes existentes
        const atributosConocidos = new Set();
        posiblesPersonajes.forEach(personaje => {
            Object.keys(personaje.caracteristicas).forEach(attr => {
                atributosConocidos.add(attr);
            });
        });
    
        // Asignamos un valor aleatorio y mantenemos la estructura con { valor, tipo }
        atributosConocidos.forEach(attr => {
            nuevasCaracteristicas[attr] = {
                valor: Math.random() < 0.5 ? 1 : 0,
                tipo: 'desconocido'  // Por defecto, tipo "desconocido"
            };
        });
    
        return nuevasCaracteristicas;
    }
        
    
    
    function actualizarPersonajesExistentes(claveNueva, tipoCaracteristica) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['personajes'], 'readwrite');
            const objectStore = transaction.objectStore('personajes');
    
            objectStore.openCursor().onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const personaje = cursor.value;
    
                    // Solo agregamos la nueva característica si no existe aún
                    if (!(claveNueva in personaje.caracteristicas)) {
                        personaje.caracteristicas[claveNueva] = {
                            valor: Math.random() < 0.5 ? 1 : 0,
                            tipo: tipoCaracteristica
                        };
                    }
    
                    cursor.update(personaje);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
    
            transaction.onerror = (event) => reject(event.target.error);
        });
    }
    
        
    
    function determinarTipoDePregunta(atributo, tipo) {
        const nombreAtributo = atributo.replace(/_/g, ' ');
    
        switch (tipo) {
            case 'posesion':
                return `¿El personaje tiene ${nombreAtributo}?`;
            case 'pertenencia':
                return `¿El personaje es ${nombreAtributo}?`;
            case 'capacidad':
                return `¿El personaje puede ${nombreAtributo}?`;
            default:
                return `¿El personaje tiene ${nombreAtributo}?`;
        }
    }
    
    
    

    function agregarPersonajeABaseDatos(personaje) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['personajes'], 'readwrite');
            const store = transaction.objectStore('personajes');

            const request = store.add(personaje);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function reiniciarJuego() {
        // Reiniciar las variables de control
        faseAdivinanza = false;
        nombreAdivinado = '';
        preguntaActual = null;
    
        // Vaciar las estructuras temporales
        posiblesPersonajes = [];
        preguntas = [];
    
        // Ocultar el formulario de nuevo personaje y mostrar el juego
        document.getElementById('nuevo-personaje-form').classList.add('oculto');
        document.getElementById('juego-container').classList.remove('oculto');
    
        // Recargar los personajes desde la base de datos
        cargarPersonajes();
    }
    

    window.actualizarVistaPrevia = function actualizarVistaPrevia() {
        const nuevaCaracteristica = document.getElementById('nueva-caracteristica-input').value.trim();
        const tipoCaracteristica = document.querySelector('input[name="tipo-caracteristica"]:checked')?.value;
        let pregunta = '';

        if (nuevaCaracteristica && tipoCaracteristica) {
            switch (tipoCaracteristica) {
                case 'posesion':
                    pregunta = `¿El personaje tiene ${nuevaCaracteristica}?`;
                    break;
                case 'pertenencia':
                    pregunta = `¿El personaje es ${nuevaCaracteristica}?`;
                    break;
                case 'capacidad':
                    pregunta = `¿El personaje puede ${nuevaCaracteristica}?`;
                    break;
                default:
                    pregunta = `¿El personaje tiene ${nuevaCaracteristica}?`;
            }
        }

        document.getElementById('vista-previa-pregunta').innerText = pregunta;
    };
});
