import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import mysql.connector
from datetime import datetime, timedelta
from flask_cors import CORS
from decimal import Decimal

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")

app.secret_key = 'clave_secreta'
CORS(app)

#Conexión a la base de datos
def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST"),
        port=int(os.environ.get("DB_PORT", 3306)),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME")
    )

#inicio.html
@app.route('/')
def index():
    return render_template('inicio.html')

@app.route('/loguear')
def aloguear():
    return render_template('index.html')

@app.route('/check_session')
def check_session():
    if 'user_id' in session:
        # Aquí podrías recuperar el rol del usuario de la sesión si lo guardaste al iniciar sesión
        rol = session.get('rol')
        nombre = session.get('nombre')
        return jsonify({"esta_logueado": True, "rol": rol, "nombre": nombre})
    else:
        return jsonify({"esta_logueado": False, "rol": None, "nombre": None})

#Registro de clientes
@app.route('/registro', methods=['POST'])
def registro():
    data = request.json
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    telefono = data.get("telefono")
    password = data.get("password")

    if not (nombre and apellido and telefono and password):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    hashed_password = password

    # Validar contraseña
    import re  
    if not re.match(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$', password):
        return jsonify({
            "error": "La contraseña debe tener 8 caracteres mínimo, y tener al menos una letra y numero"
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO clientes (nombre, apellido, telefono, password) VALUES (%s, %s, %s, %s)",
                       (nombre, apellido, telefono, hashed_password))
        conn.commit()
        return jsonify({"mensaje": "Registro exitoso"}), 201
    except mysql.connector.Error:
        return jsonify({"error": "Error al registrar usuario"}), 500
    finally:
        cursor.close()
        conn.close()

#Login de usuario
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    telefono = data.get("telefono")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clientes WHERE telefono = %s", (telefono,))
    cliente = cursor.fetchone()

    cursor.execute("SELECT * FROM barberos WHERE telefono = %s", (telefono,))
    barbero = cursor.fetchone()

    # Validar contraseña
    import re  
    if not re.match(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$', password):
        return jsonify({
            "error": "La contraseña debe tener 8 caracteres mínimo, y tener al menos una letra y numero"
        }), 400

    cursor.close()
    conn.close()
    if cliente and cliente["password"] == password:
        session['user_id'] = cliente["id"]
        session['nombre'] = cliente["nombre"]
        session['rol'] = 'cliente'
        return jsonify({"mensaje": "Inicio de sesión exitoso", "rol": "cliente", "nombre": cliente["nombre"]})
    elif barbero and barbero["password"] == password:
        session['user_id'] = barbero["id"]
        session['nombre'] = barbero["nombre"]
        session['rol'] = 'admin'
        return jsonify({"mensaje": "Inicio de sesión exitoso", "rol": "admin", "nombre": barbero["nombre"]})
    else:
        return jsonify({"error": "Teléfono o contraseña incorrectos"}), 401

#Ruta del administrador
@app.route('/admin')
def admin():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    if session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, telefono FROM clientes")
    clientes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return render_template('admin.html', clientes=clientes)

#Ruta para clientes
@app.route('/inicio')
def inicio():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, telefono FROM clientes WHERE telefono = %s", (session['user_id'],))
    cliente = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return render_template('inicio.html', cliente=cliente)

#Obtener nombre de barbero
@app.route('/get_barbero')
def get_barbero():
    if 'nombre' in session:
        return jsonify({"nombre": session['nombre']})
    return jsonify({"error": "No autenticado"}), 401

#Mostrar datos del Barbero
@app.route('/mostrar_info')
def mostrar_info():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT nombre, apellido, telefono FROM barberos WHERE id = %s", (session['user_id'],))
    barbero = cursor.fetchone()
    cursor.close()
    conn.close()

    if barbero:
        return jsonify(barbero)
    return jsonify({"error": "No encontrado"}), 404

#Lista de barberos
@app.route('/lista_barberos')
def lista_barberos():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401
    if session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, apellido, telefono FROM barberos WHERE id != %s", (session['user_id'],))
    barberos = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(barberos)

#Eliminar Barbero
@app.route('/eliminar_barbero/<int:barbero_id>', methods=['DELETE'])
def eliminar_barbero(barbero_id):
    if 'user_id' not in session:
        return jsonify({"mensaje": "No autorizado"}), 401
    if session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM barberos WHERE id = %s", (barbero_id,))
        conn.commit()
        return jsonify({"mensaje": "Barbero eliminado correctamente"})
    except Exception as e:
        return jsonify({"mensaje": f"Error al eliminar barbero: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

#obtener clientes
@app.route('/get_clientes')
def get_clientes():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401
    if session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 403  

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT nombre, apellido, telefono FROM clientes")  
    clientes = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(clientes)

#registrar barbero
@app.route('/registrar_barbero', methods=['POST'])
def registrar_barbero():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401
    if session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    datos = request.json
    nombre = datos.get('nombre')
    apellido = datos.get('apellido')
    telefono = datos.get('telefono')
    password = datos.get('password')

    if not nombre or not apellido or not telefono or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Validar contraseña
    import re  
    if not re.match(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$', password):
        return jsonify({
            "error": "La contraseña debe tener 8 caracteres mínimo, y tener al menos una letra y numero"
        }), 400

    try:
        cursor.execute("INSERT INTO barberos (nombre, apellido, telefono, password) VALUES (%s, %s, %s, %s)",
                       (nombre, apellido, telefono, password))
        conn.commit()
        return jsonify({"mensaje": "Barbero registrado correctamente"}), 201
    except Exception as e:
        return jsonify({"error": "Error al registrar el barbero: " + str(e)}), 500
    finally:
        cursor.close()
        conn.close()

#Actualizar perfil
@app.route('/actualizar_perfil', methods=['POST'])
def actualizar_perfil():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401
    if session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    datos = request.json
    nombre = datos.get('nombre')
    apellido = datos.get('apellido')
    telefono = datos.get('telefono')
    password = datos.get('password')

    if not nombre or not apellido or not telefono:
        return jsonify({"error": "nombre, apellido y telefono son obligatorio"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE barberos SET nombre = %s, apellido = %s, telefono = %s, password = %s WHERE id = %s",
               (nombre, apellido, telefono, password, session['user_id']))
        conn.commit()
        return jsonify({"mensaje": "Perfil actualizado correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

#Informacion de cliente
@app.route('/get_cliente')
def get_cliente():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT nombre, apellido, telefono FROM clientes WHERE id = %s", (session['user_id'],))
    cliente = cursor.fetchone()
    cursor.close()
    conn.close()

    return jsonify(cliente)

#Actualizar datos de cliente
@app.route('/actualizar_perfil_cliente', methods=['POST'])
def actualizar_perfil_cliente():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401

    datos = request.json
    nombre = datos.get('nombre')
    apellido = datos.get('apellido')
    telefono = datos.get('telefono')

    if not nombre or not apellido or not telefono:
        return jsonify({"error": "Nombre, apellido y teléfono son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE clientes SET nombre = %s, apellido = %s, telefono = %s WHERE id = %s",
            (nombre, apellido, telefono, session['user_id'])
        )
        
        conn.commit()
        return jsonify({"mensaje": "Perfil actualizado correctamente"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/servicios.html')
def servicios():
    return render_template('servicios.html')

@app.route('/obtener_servicios')
def obtener_servicios():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, duracion, precio, frecuente FROM servicios")
    servicios = cursor.fetchall()
    cursor.close()
    conn.close()

    # Convertir la duración a cadena (HH:MM:SS)
    for servicio in servicios:
        if servicio['duracion']:
            servicio['duracion'] = str(servicio['duracion'])

    return jsonify(servicios)
    
@app.route('/obtener_barberos')
def obtener_barberos():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, apellido FROM barberos")
    barberos = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(barberos)

@app.route('/reservar.html')
def reservar():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('reservar.html')

@app.route('/inicio.html')
def regresar():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('inicio.html')

@app.route('/crear_cita', methods=['POST'])
def crear_cita():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    fecha = data.get('fecha')
    hora = data.get('hora')
    barbero_id = data.get('barbero_id')
    servicio_id = data.get('servicio_id')
    cliente_id = session['user_id']

    if not fecha or not hora or not barbero_id or not servicio_id:
        return jsonify({"error": "Faltan datos"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Obtener duración del servicio
        cursor.execute("SELECT duracion FROM servicios WHERE id = %s", (servicio_id,))
        resultado = cursor.fetchone()
        if not resultado:
            return jsonify({"error": "Servicio no encontrado"}), 404

        duracion_str = str(resultado[0])
        h, m, s = map(int, duracion_str.split(':'))
        duracion = timedelta(hours=h, minutes=m, seconds=s)

        hora_inicio = datetime.strptime(hora, "%H:%M")
        hora_fin = hora_inicio + duracion

        # Validar conflictos
        cursor.execute("""
            SELECT c.hora, s.duracion FROM citas c
            JOIN servicios s ON c.servicios_id = s.id
            WHERE c.barberos_id = %s AND c.fecha = %s
        """, (barbero_id, fecha))
        citas_existentes = cursor.fetchall()

        for cita_hora, cita_duracion in citas_existentes:
            h2, m2, s2 = map(int, str(cita_duracion).split(':'))
            duracion_cita = timedelta(hours=h2, minutes=m2, seconds=s2)

            cita_inicio = datetime.strptime(str(cita_hora), "%H:%M:%S")
            cita_fin = cita_inicio + duracion_cita

            if (hora_inicio < cita_fin and hora_fin > cita_inicio):
                cursor.close()
                conn.close()
                return jsonify({"error": "El barbero ya tiene una cita en ese horario"}), 409

        # Insertar cita
        cursor.execute("""
            INSERT INTO citas (cliente_id, barberos_id, servicios_id, fecha, hora)
            VALUES (%s, %s, %s, %s, %s)
        """, (cliente_id, barbero_id, servicio_id, fecha, hora))

        # Obtener nombre del cliente para la notificación al barbero
        cursor.execute("SELECT nombre FROM clientes WHERE id = %s", (cliente_id,))
        cliente_info = cursor.fetchone()
        cliente_nombre = cliente_info[0] if cliente_info else 'Un cliente'

        cursor.execute("SELECT nombre FROM servicios WHERE id = %s", (servicio_id,))
        servicio_info = cursor.fetchone()
        servicio_nombre = servicio_info[0] if servicio_info else 'Un servicio'

        # Crear notificación para el barbero
        mensaje_barbero = f"{cliente_nombre} ha reservado el servicio '{servicio_nombre}' para el {fecha} a las {hora}."
        cursor.execute("""
            INSERT INTO notificaciones (barbero_id, mensaje)
            VALUES (%s, %s)
        """, (barbero_id, mensaje_barbero))

        # Crear notificación para el cliente
        mensaje_cliente = f"Has reservado el servicio '{servicio_nombre}' con el barbero #{barbero_id} para el {fecha} a las {hora}."
        cursor.execute("""
            INSERT INTO notificaciones (cliente_id, mensaje)
            VALUES (%s, %s)
        """, (cliente_id, mensaje_cliente))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"mensaje": "Cita creada y notificaciones enviadas"}), 201

    except mysql.connector.Error as error:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Error al crear la cita: {error}"}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
    
#Obtener historial de citas del cliente
@app.route('/historial_cliente')
def historial_cliente():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                b.nombre AS barbero,
                s.nombre AS servicio,
                c.fecha,
                c.hora,
                c.estado
            FROM
                citas c
            JOIN
                barberos b ON c.barberos_id = b.id
            JOIN
                servicios s ON c.servicios_id = s.id
            WHERE
                c.cliente_id = %s
            ORDER BY
                c.fecha DESC, c.hora DESC
            LIMIT 5
        """, (session['user_id'],))
        citas = cursor.fetchall()

        for cita in citas:
            if isinstance(cita["hora"], timedelta):
                cita["hora"] = (datetime.min + cita["hora"]).time().strftime("%H:%M:%S")

        return jsonify(citas)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al ejecutar la consulta: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Obtener citas del barbero
@app.route('/citas_barbero')
def citas_barbero():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT c.id, cl.nombre as cliente, c.fecha, c.hora, c.estado
            FROM citas c
            JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.barberos_id = %s
        """, (session['user_id'],))
        citas = cursor.fetchall()

        for cita in citas:
            if isinstance(cita["hora"], timedelta):
                cita["hora"] = (datetime.min + cita["hora"]).time().strftime("%H:%M:%S")

        return jsonify(citas)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al ejecutar la consulta: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Actualizar el estado de una cita
@app.route('/actualizar_cita/<int:cita_id>', methods=['POST'])
def actualizar_cita(cita_id):
    if 'user_id' not in session or session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    estado = data.get('estado')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE citas SET estado = %s WHERE id = %s", (estado, cita_id))
        conn.commit()

        # Obtener el ID del cliente asociado a esta cita
        cursor.execute("SELECT cliente_id FROM citas WHERE id = %s", (cita_id,))
        cliente_info = cursor.fetchone()
        if cliente_info:
            cliente_id = cliente_info[0]

            # Obtener información de la cita para el mensaje
            cursor.execute("""
                SELECT b.nombre as barbero_nombre, s.nombre as servicio_nombre, c.fecha, c.hora
                FROM citas c
                JOIN barberos b ON c.barberos_id = b.id
                JOIN servicios s ON c.servicios_id = s.id
                WHERE c.id = %s
            """, (cita_id,))
            cita_detalles = cursor.fetchone()

            if cita_detalles:
                barbero_nombre = cita_detalles[0]
                servicio_nombre = cita_detalles[1]
                fecha_cita = cita_detalles[2]
                hora_cita = cita_detalles[3]

                mensaje_cliente = ""
                if estado == 'confirmada':
                    mensaje_cliente = f"Tu cita para el servicio '{servicio_nombre}' con {barbero_nombre} el {fecha_cita} a las {hora_cita} ha sido confirmada."
                elif estado == 'cancelada':
                    mensaje_cliente = f"Tu cita para el servicio '{servicio_nombre}' con {barbero_nombre} el {fecha_cita} a las {hora_cita} ha sido rechazada."

                if mensaje_cliente:
                    cursor.execute("""
                        INSERT INTO notificaciones (cliente_id, mensaje)
                        VALUES (%s, %s)
                    """, (cliente_id, mensaje_cliente))
                    conn.commit()

        return jsonify({"mensaje": "Estado de la cita actualizado correctamente"})
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Error al actualizar el estado: {err}"}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

#Ruta para recibir y guardar la calificación del servicio
@app.route('/calificar_servicio', methods=['POST'])
def calificar_servicio():
    if 'user_id' not in session:
        return jsonify({"error": "Debes estar logueado para calificar."}), 401

    data = request.get_json()
    servicio_id = data.get('servicio_id')
    puntuacion = data.get('puntuacion')
    comentario = data.get('comentario')
    cliente_id = session['user_id']

    if not servicio_id or not puntuacion:
        return jsonify({"error": "Servicio ID y puntuación son requeridos."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO opiniones_servicios (servicio_id, cliente_id, puntuacion, comentario)
            VALUES (%s, %s, %s, %s)
        """, (servicio_id, cliente_id, puntuacion, comentario))
        conn.commit()
        return jsonify({"mensaje": "Calificación guardada correctamente"})
    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({"error": f"Error al guardar la calificación: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Ruta para obtener el promedio de calificación de un servicio
@app.route('/obtener_promedio_calificacion_servicio/<int:servicio_id>')
def obtener_promedio_calificacion_servicio(servicio_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT AVG(puntuacion) AS promedio
            FROM opiniones_servicios
            WHERE servicio_id = %s
        """, (servicio_id,))
        resultado = cursor.fetchone()
        promedio = resultado[0] if resultado[0] is not None else None
        return jsonify({"promedio": promedio})
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener el promedio de calificación: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Ruta para obtener todos los comentarios de un servicio
@app.route('/obtener_comentarios_servicio/<int:servicio_id>')
def obtener_comentarios_servicio(servicio_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT puntuacion, comentario, fecha
            FROM opiniones_servicios
            WHERE servicio_id = %s
            ORDER BY fecha DESC
        """, (servicio_id,))
        comentarios = cursor.fetchall()
        return jsonify(comentarios)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener los comentarios: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Ruta para obtener la lista de barberos
@app.route('/barberos_inicio')
def barberos_inicio():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, nombre, apellido FROM barberos")
        barberos = cursor.fetchall()
        return jsonify(barberos)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener los barberos: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Ruta para obtener el promedio de calificación de un barbero
@app.route('/obtener_promedio_calificacion_barbero/<int:barbero_id>')
def obtener_promedio_calificacion_barbero(barbero_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT AVG(puntuacion) AS promedio
            FROM opiniones_barberos
            WHERE barbero_id = %s
        """, (barbero_id,))
        resultado = cursor.fetchone()
        promedio = resultado[0] if resultado[0] is not None else None
        return jsonify({"promedio": promedio})
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener el promedio de calificación del barbero: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Ruta para recibir y guardar la calificación del barbero
@app.route('/calificar_barbero', methods=['POST'])
def calificar_barbero():
    if 'user_id' not in session:
        return jsonify({"error": "Debes estar logueado para calificar."}), 401

    data = request.get_json()
    barbero_id = data.get('barbero_id')
    puntuacion = data.get('puntuacion')
    comentario = data.get('comentario')
    cliente_id = session['user_id']

    if not barbero_id or not puntuacion:
        return jsonify({"error": "Barbero ID y puntuación son requeridos."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO opiniones_barberos (barbero_id, cliente_id, puntuacion, comentario, fecha)
            VALUES (%s, %s, %s, %s, NOW())
        """, (barbero_id, cliente_id, puntuacion, comentario))
        conn.commit()
        return jsonify({"mensaje": "Calificación del barbero guardada correctamente"})
    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({"error": f"Error al guardar la calificación del barbero: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Ruta para obtener todos los comentarios de un barbero
@app.route('/obtener_comentarios_barbero/<int:barbero_id>')
def obtener_comentarios_barbero(barbero_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT puntuacion, comentario, fecha
            FROM opiniones_barberos
            WHERE barbero_id = %s
            ORDER BY fecha DESC
        """, (barbero_id,))
        comentarios = cursor.fetchall()
        return jsonify(comentarios)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener los comentarios del barbero: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/get_calificacion_comentarios_barbero')
def get_calificacion_comentarios_barbero():
    barbero_id = session.get('user_id')
    if not barbero_id:
        return jsonify({"error": "Usuario no autenticado"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    response = {}

    try:
        # Verificar si el usuario en sesión es un barbero
        cursor.execute("SELECT id FROM barberos WHERE id = %s", (barbero_id,))
        es_barbero = cursor.fetchone()

        if not es_barbero:
            return jsonify({"error": "El usuario no es un barbero"}), 403

        # Obtener el promedio de calificación para el barbero
        cursor.execute("""
            SELECT AVG(puntuacion) AS promedio
            FROM opiniones_barberos
            WHERE barbero_id = %s
        """, (barbero_id,))
        promedio_resultado = cursor.fetchone()
        promedio_decimal = promedio_resultado['promedio']
        response['promedio_calificacion'] = float(promedio_decimal) if promedio_decimal is not None else None 

        # Obtener los comentarios para el barbero
        cursor.execute("""
            SELECT u.nombre AS nombre_cliente, u.apellido AS apellido_cliente, ob.comentario AS texto, ob.fecha AS fecha
            FROM opiniones_barberos ob
            JOIN clientes u ON ob.cliente_id = u.id
            WHERE ob.barbero_id = %s AND ob.comentario IS NOT NULL AND ob.comentario != ''
            ORDER BY ob.fecha DESC
        """, (barbero_id,))
        comentarios = cursor.fetchall()
        response['comentarios'] = comentarios

        return jsonify(response)

    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener la calificación y comentarios: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Dashboard
@app.route('/admin/estadisticas')
def obtener_estadisticas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    estadisticas = {}

    #Datos Generales
    cursor.execute("SELECT COUNT(*) AS total_clientes FROM clientes")
    estadisticas['total_clientes'] = cursor.fetchone()['total_clientes']

    cursor.execute("SELECT COUNT(*) AS total_barberos FROM barberos")
    estadisticas['total_barberos'] = cursor.fetchone()['total_barberos']

    #Servicios Más Solicitados
    cursor.execute("""
        SELECT s.nombre, COUNT(c.id) AS veces_solicitado
        FROM servicios s
        LEFT JOIN citas c ON c.servicios_id = s.id
        GROUP BY s.id
        ORDER BY veces_solicitado DESC
    """)
    estadisticas['servicios_mas_solicitados'] = [{'nombre': row['nombre'], 'veces_solicitado': row['veces_solicitado']} for row in cursor.fetchall()]

    #Barbero con Más Citas
    cursor.execute("""
        SELECT b.nombre, COUNT(c.id) AS cantidad_citas
        FROM barberos b
        JOIN citas c ON c.barberos_id = b.id
        GROUP BY b.id
        ORDER BY cantidad_citas DESC
        LIMIT 1
    """)
    estadisticas['barbero_top'] = cursor.fetchone()

    #Promedio de Valoración por Barbero
    cursor.execute("""
        SELECT b.nombre, ROUND(AVG(ob.puntuacion), 2) AS promedio_valoracion
        FROM barberos b
        JOIN opiniones_barberos ob ON ob.barbero_id = b.id
        GROUP BY b.id
    """)
    estadisticas['valoraciones'] = cursor.fetchall()

    #Días con Más Citas
    cursor.execute("""
        SELECT DATE(fecha) AS dia, COUNT(*) AS cantidad
        FROM citas
        GROUP BY dia
        ORDER BY cantidad DESC
        LIMIT 7
    """)
    estadisticas['dias_mas_citas'] = cursor.fetchall()

    #Top Clientes con Más Reservas
    cursor.execute("""
        SELECT cl.nombre, COUNT(*) AS reservas
        FROM clientes cl
        JOIN citas c ON c.cliente_id = cl.id
        GROUP BY cl.id
        ORDER BY reservas DESC
        LIMIT 3
    """)
    estadisticas['top_clientes'] = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(estadisticas)

#Notificaciones del barbero
@app.route('/get_notificaciones_barbero')
def get_notificaciones_barbero():
    if 'user_id' not in session or session.get('rol') != 'admin':
        return jsonify({"error": "No autorizado"}), 401

    barbero_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, mensaje, leida, fecha FROM notificaciones WHERE barbero_id = %s ORDER BY fecha DESC", (barbero_id,))
        notificaciones = cursor.fetchall()
        return jsonify(notificaciones)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener las notificaciones: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

#Notificaciones del cliente
@app.route('/get_notificaciones_cliente')
def get_notificaciones_cliente():
    if 'user_id' not in session or session.get('rol') != 'cliente':
        return jsonify({"error": "No autorizado"}), 401

    cliente_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, mensaje, leida, fecha FROM notificaciones WHERE cliente_id = %s ORDER BY fecha DESC LIMIT 8", (cliente_id,))
        notificaciones = cursor.fetchall()
        return jsonify(notificaciones)
    except mysql.connector.Error as err:
        return jsonify({"error": f"Error al obtener las notificaciones: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

# Cerrar sesión
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)