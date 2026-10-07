/* Motor de la demo "Habla con un asistente de Innova AI".
 *
 * Hoy funciona en modo SIMULADO: entiende la intención con reglas y responde con
 * datos de ejemplo de cada industria. Nunca inventa: si la pregunta no está en la
 * base del negocio, lo dice y ofrece pasar con una persona (blindaje).
 *
 * Para conectar un modelo de IA real más adelante, define antes de cargar este archivo:
 *   window.INNOVA_DEMO_ENDPOINT = "https://tu-bot.workers.dev/demo";
 * La UI enviará POST { industry, lang, message, history } y espera
 *   { reply: "texto", analysis: { intent, data, decision, human }, actions: [[icono, texto, caliente?]], hot: bool }
 * Si el endpoint falla, la demo vuelve sola al modo simulado.
 */
var DemoEngine = (function () {
  "use strict";

  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  var KB = {
    restaurante: { icon: "fork-knife",
      es: { label: "Restaurante", biz: "Fogón de la 70", bookLabel: "Reservar mesa", agenda: "Agenda de mesas",
        greet: "¡Hola! Bienvenido a Fogón de la 70. ¿Quieres reservar, ver el menú o conocer nuestros horarios?",
        services: "Somos cocina colombiana a la brasa: carnes, pescados y opciones vegetarianas. Al mediodía tenemos menú del día.",
        price: "El menú del día cuesta $28.000 y los platos a la carta van de $32.000 a $65.000.",
        hours: "Abrimos de martes a domingo, de 12:00 m. a 10:00 p. m. Los lunes descansamos.",
        location: "Estamos en la calle 70 con carrera 5, en Bogotá. Hay parqueadero aliado a media cuadra.",
        payment: "Recibimos efectivo, tarjetas débito y crédito, y transferencias.",
        ask: "Para el sábado en la noche tengo mesa a las 7:00 p. m., 8:00 p. m. y 9:30 p. m. ¿Cuál prefieres?",
        confirm: "Listo, te aparto esa mesa. ¿A nombre de quién hago la reserva?",
        done: "Reserva confirmada a nombre de {name}. Te envío un recordatorio el mismo día. ¡Te esperamos!",
        script: ["Hola, ¿tienen mesa para 4 el sábado en la noche?", "A las 8, por favor."],
        slotSugg: "A las 8, por favor.", nameSugg: "A nombre de Camila Rojas",
        sugg: ["¿Qué tienen en el menú?", "¿Hasta qué hora abren?", "¿Me hacen un descuento?", "Quiero hablar con una persona"] },
      en: { label: "Restaurant", biz: "Fogón de la 70", bookLabel: "Book a table", agenda: "Table calendar",
        greet: "Hi! Welcome to Fogón de la 70. Would you like to book, see the menu or check our hours?",
        services: "We serve Colombian grill food: meats, fish and vegetarian options. At lunch we have a set menu.",
        price: "The lunch menu is $28,000 and à la carte dishes range from $32,000 to $65,000.",
        hours: "We're open Tuesday to Sunday, 12:00 p.m. to 10:00 p.m. We're closed on Mondays.",
        location: "We're at Calle 70 and Carrera 5 in Bogotá. There's partner parking half a block away.",
        payment: "We accept cash, debit and credit cards, and bank transfers.",
        ask: "For Saturday night I have tables at 7:00 p.m., 8:00 p.m. and 9:30 p.m. Which do you prefer?",
        confirm: "Done, I'm holding that table for you. What name should the booking be under?",
        done: "Booking confirmed under {name}. I'll send you a reminder on the day. See you then!",
        script: ["Hi, do you have a table for 4 on Saturday night?", "At 8, please."],
        slotSugg: "At 8, please.", nameSugg: "Under Camila Rojas",
        sugg: ["What's on the menu?", "Until what time are you open?", "Can I get a discount?", "I want to talk to a person"] } },

    consultorio: { icon: "stethoscope",
      es: { label: "Consultorio", biz: "Centro Dental Arce", bookLabel: "Agendar cita", agenda: "Agenda de citas",
        greet: "¡Hola! Te escribe el asistente del Centro Dental Arce. ¿Quieres agendar una cita o tienes alguna pregunta?",
        services: "Hacemos valoración, limpieza, resinas, ortodoncia y blanqueamiento.",
        price: "La valoración cuesta $60.000 y la limpieza dental $120.000. El valor de la ortodoncia se define después de la valoración.",
        hours: "Atendemos de lunes a viernes de 8:00 a. m. a 6:00 p. m. y los sábados de 8:00 a. m. a 12:00 m.",
        location: "Estamos en Laureles, Medellín, en la circular 4 con carrera 70, consultorio 302.",
        payment: "Puedes pagar en efectivo, con tarjeta o por transferencia.",
        ask: "Tengo disponible el jueves a las 9:00 a. m. o el viernes a las 4:00 p. m. ¿Cuál te sirve?",
        confirm: "Perfecto, te aparto ese espacio. ¿Me compartes tu nombre completo para la cita?",
        done: "Listo, {name}. Tu cita quedó agendada y te envío un recordatorio un día antes. Por favor llega 10 minutos antes.",
        script: ["Hola, quiero agendar una limpieza dental.", "El jueves me sirve."],
        slotSugg: "El jueves me sirve.", nameSugg: "Soy Andrés Gómez",
        sugg: ["¿Cuánto cuesta la valoración?", "¿Atienden los sábados?", "Me duele mucho una muela", "¿Atienden por mi seguro médico?"] },
      en: { label: "Medical practice", biz: "Centro Dental Arce", bookLabel: "Book an appointment", agenda: "Appointment calendar",
        greet: "Hi! This is Centro Dental Arce's assistant. Would you like to book an appointment or do you have a question?",
        services: "We offer check-ups, cleanings, fillings, orthodontics and whitening.",
        price: "A check-up is $60,000 and a dental cleaning is $120,000. Orthodontics is priced after the check-up.",
        hours: "We're open Monday to Friday from 8:00 a.m. to 6:00 p.m. and Saturdays from 8:00 a.m. to 12:00 p.m.",
        location: "We're in Laureles, Medellín, at Circular 4 and Carrera 70, office 302.",
        payment: "You can pay in cash, by card or by bank transfer.",
        ask: "I have Thursday at 9:00 a.m. or Friday at 4:00 p.m. Which works for you?",
        confirm: "Perfect, I'm holding that slot. Could you share your full name for the appointment?",
        done: "Done, {name}. Your appointment is booked and I'll send you a reminder the day before. Please arrive 10 minutes early.",
        script: ["Hi, I'd like to book a dental cleaning.", "Thursday works for me."],
        slotSugg: "Thursday works for me.", nameSugg: "I'm Andrés Gómez",
        sugg: ["How much is a check-up?", "Are you open on Saturdays?", "My tooth really hurts", "Do you take my health insurance?"] } },

    hotel: { icon: "bed", slots: "doble|familiar|double|family|vista|view",
      es: { label: "Hotel", biz: "Hotel Mar de Leva", bookLabel: "Reservar habitación", agenda: "Disponibilidad de habitaciones",
        greet: "¡Hola! Bienvenido al Hotel Mar de Leva. ¿Te ayudo con una reserva o con información del hotel? También te atiendo en inglés.",
        services: "Tenemos habitaciones dobles y familiares con vista al mar, piscina, restaurante y traslado desde el aeropuerto. El desayuno está incluido.",
        price: "La habitación doble está desde $380.000 por noche con desayuno incluido. La familiar, desde $520.000.",
        hours: "El check-in es desde las 3:00 p. m. y el check-out hasta la 1:00 p. m. La recepción atiende las 24 horas.",
        location: "Estamos en Bocagrande, Cartagena, a 15 minutos del aeropuerto.",
        payment: "Puedes pagar con tarjeta, transferencia o en el hotel. Para confirmar la reserva pedimos un anticipo del 30%.",
        ask: "Para esas fechas tengo habitación doble con vista al mar o habitación familiar. ¿Cuál prefieres?",
        confirm: "Excelente elección. ¿A nombre de quién hago la reserva?",
        done: "Gracias, {name}. Dejé la reserva en espera y recepción te confirma el anticipo en unos minutos.",
        script: ["Hola, ¿tienen habitación del 20 al 23 de diciembre para 2 personas?", "La doble, por favor."],
        slotSugg: "La doble, por favor.", nameSugg: "A nombre de Valentina Ortiz",
        sugg: ["¿Incluye desayuno?", "¿A qué hora es el check-in?", "Do you speak English?", "¿Aceptan mascotas?"] },
      en: { label: "Hotel", biz: "Hotel Mar de Leva", bookLabel: "Book a room", agenda: "Room availability",
        greet: "Hi! Welcome to Hotel Mar de Leva. Can I help you with a booking or hotel information? I can also help you in Spanish.",
        services: "We have double and family rooms with sea views, a pool, a restaurant and airport transfers. Breakfast is included.",
        price: "Double rooms start at $380,000 per night with breakfast. Family rooms start at $520,000.",
        hours: "Check-in is from 3:00 p.m. and check-out is until 1:00 p.m. The front desk is open 24 hours.",
        location: "We're in Bocagrande, Cartagena, 15 minutes from the airport.",
        payment: "You can pay by card, bank transfer or at the hotel. We ask for a 30% deposit to confirm.",
        ask: "For those dates I have a double room with a sea view or a family room. Which do you prefer?",
        confirm: "Great choice. What name should the booking be under?",
        done: "Thank you, {name}. Your booking is on hold and the front desk will confirm the deposit in a few minutes.",
        script: ["Hi, do you have a room from December 20 to 23 for 2 people?", "The double, please."],
        slotSugg: "The double, please.", nameSugg: "Under Valentina Ortiz",
        sugg: ["Is breakfast included?", "What time is check-in?", "¿Hablan español?", "Do you allow pets?"] } },

    agencia: { icon: "airplane-tilt", book: "quiero ir|queremos ir|ir a |viajar a|vacaciones|want to go|trip to|travel to|vacation",
      es: { label: "Agencia de viajes", biz: "Rumbo Viajes", bookLabel: "Cotizar un viaje", agenda: "Planes y tarifas de temporada",
        greet: "¡Hola! Soy el asistente de Rumbo Viajes. ¿A dónde te gustaría viajar?",
        services: "Armamos planes nacionales e internacionales con vuelos, hoteles, traslados y tours. También viajes en grupo y lunas de miel.",
        price: "Un plan a San Andrés de 4 noches está desde $1.890.000 por persona con vuelos y hotel. El valor final depende de las fechas y la temporada.",
        hours: "Nuestros asesores atienden de lunes a sábado de 8:00 a. m. a 7:00 p. m. Yo te atiendo a cualquier hora.",
        location: "Estamos en Pereira y atendemos todo el país por WhatsApp y videollamada.",
        payment: "Puedes reservar con el 30% y pagar el resto hasta 15 días antes del viaje. Recibimos tarjeta, transferencia y PSE.",
        ask: "¡Qué buen plan! ¿Cuántas personas viajan y qué presupuesto aproximado tienen por persona?",
        confirm: "Perfecto, con eso armo una primera propuesta. ¿A nombre de quién la preparo?",
        done: "Gracias, {name}. Te envío la propuesta y un asesor te escribe hoy para ajustar fechas y reservar.",
        script: ["Quiero ir a San Andrés en junio con mi familia.", "Somos 4 y tenemos unos 2 millones por persona."],
        slotSugg: "Somos 4 y tenemos unos 2 millones por persona.", nameSugg: "A nombre de Laura Restrepo",
        sugg: ["¿Qué incluye el plan?", "¿Puedo pagar a cuotas?", "¿Necesito pasaporte?", "Quiero hablar con un asesor"] },
      en: { label: "Travel agency", biz: "Rumbo Viajes", bookLabel: "Quote a trip", agenda: "Seasonal packages and rates",
        greet: "Hi! I'm Rumbo Viajes' assistant. Where would you like to travel?",
        services: "We put together domestic and international packages with flights, hotels, transfers and tours. Group trips and honeymoons too.",
        price: "A 4-night San Andrés package starts at $1,890,000 per person with flights and hotel. The final price depends on dates and season.",
        hours: "Our advisors work Monday to Saturday from 8:00 a.m. to 7:00 p.m. I'm here at any hour.",
        location: "We're based in Pereira and serve the whole country on WhatsApp and video calls.",
        payment: "You can book with 30% and pay the rest up to 15 days before the trip. We accept cards, bank transfers and PSE.",
        ask: "Great plan! How many people are traveling and what's your approximate budget per person?",
        confirm: "Perfect, with that I'll put together a first proposal. What name should I prepare it under?",
        done: "Thank you, {name}. I'm sending you the proposal and an advisor will message you today to adjust dates and book.",
        script: ["I want to go to San Andrés in June with my family.", "We're 4 people with about 2 million per person."],
        slotSugg: "We're 4 people with about 2 million per person.", nameSugg: "Under Laura Restrepo",
        sugg: ["What does the package include?", "Can I pay in installments?", "Do I need a passport?", "I want to talk to an advisor"] } },

    tienda: { icon: "storefront", book: "tienen (la|el|los|las|un|una)|talla|separ|in stock|size|do you have (the|a|an)", slots: "si|separ|envi|domicilio|yes|hold|ship|deliver",
      es: { label: "Tienda", biz: "Tienda Alba", bookLabel: "Separar un producto", agenda: "Inventario de la tienda",
        greet: "¡Hola! Bienvenido a Tienda Alba. ¿Buscas alguna prenda en especial?",
        services: "Tenemos ropa para mujer y hombre: chaquetas, jeans, camisas y accesorios. Cada semana llegan referencias nuevas.",
        price: "Las camisetas están desde $59.000, los jeans desde $129.000 y las chaquetas desde $189.000.",
        hours: "Abrimos de lunes a sábado de 10:00 a. m. a 8:00 p. m. y los domingos de 11:00 a. m. a 6:00 p. m.",
        location: "Estamos en el centro comercial Unicentro de Cali, local 214.",
        payment: "Recibimos efectivo, tarjetas, Nequi y transferencia.",
        shipping: "Hacemos domicilios en Cali el mismo día por $8.000 y envíos nacionales en 2 a 4 días hábiles.",
        ask: "Sí, tenemos esa referencia disponible en la tienda. ¿Quieres que te la separe hasta mañana o prefieres que te la enviemos?",
        confirm: "Hecho, te la separo. ¿A nombre de quién la dejo?",
        done: "Listo, {name}. Tu prenda queda separada hasta mañana a las 8:00 p. m. Ya le avisé al equipo para tenerla lista.",
        script: ["¿Tienen la chaqueta negra en talla M?", "Sí, sepáramela."],
        slotSugg: "Sí, sepáramela.", nameSugg: "A nombre de Mariana López",
        sugg: ["¿Hacen domicilios?", "¿Qué medios de pago tienen?", "¿Puedo cambiar una prenda?", "Quiero hablar con una persona"] },
      en: { label: "Store", biz: "Tienda Alba", bookLabel: "Hold a product", agenda: "Store inventory",
        greet: "Hi! Welcome to Tienda Alba. Are you looking for something in particular?",
        services: "We carry women's and men's clothing: jackets, jeans, shirts and accessories. New styles arrive every week.",
        price: "T-shirts start at $59,000, jeans at $129,000 and jackets at $189,000.",
        hours: "We're open Monday to Saturday from 10:00 a.m. to 8:00 p.m. and Sundays from 11:00 a.m. to 6:00 p.m.",
        location: "We're at Unicentro mall in Cali, store 214.",
        payment: "We accept cash, cards, Nequi and bank transfers.",
        shipping: "Same-day delivery in Cali for $8,000 and nationwide shipping in 2 to 4 business days.",
        ask: "Yes, we have that item in store. Would you like me to hold it until tomorrow, or would you prefer we ship it?",
        confirm: "Done, I'm holding it. What name should I put it under?",
        done: "All set, {name}. Your item is on hold until tomorrow at 8:00 p.m. I've let the team know to have it ready.",
        script: ["Do you have the black jacket in size M?", "Yes, please hold it."],
        slotSugg: "Yes, please hold it.", nameSugg: "Under Mariana López",
        sugg: ["Do you deliver?", "What payment methods do you take?", "Can I exchange an item?", "I want to talk to a person"] } },

    ecommerce: { icon: "shopping-cart", slots: "tarjeta|pse|contraentrega|card|cash|delivery",
      es: { label: "E-commerce", biz: "Casa Ceiba", bookLabel: "Comprar", agenda: "Catálogo y pasarela de pago",
        greet: "¡Hola! Soy el asistente de Casa Ceiba. ¿Te ayudo a encontrar algo para tu casa o con un pedido?",
        services: "Vendemos artículos para el hogar: vajillas, textiles, lámparas y decoración. Todo se compra en línea.",
        price: "Las vajillas de 16 piezas están desde $219.000 y las lámparas desde $149.000.",
        hours: "La tienda en línea funciona 24/7. Servicio al cliente atiende de lunes a viernes de 8:00 a. m. a 6:00 p. m.",
        location: "Somos una tienda 100% en línea con bodega en Bogotá y enviamos a todo el país.",
        payment: "Puedes pagar con tarjeta, PSE o contraentrega en las ciudades principales.",
        shipping: "A ciudades principales el envío tarda de 2 a 3 días hábiles y es gratis en compras desde $250.000.",
        returns: "Tienes 30 días para cambios o devoluciones si el producto está sin uso y en su empaque original.",
        track: "Con gusto lo reviso. ¿Me compartes el número de tu pedido?", tracked: "Encontré el pedido {n}: salió de bodega hoy y llega en 2 días hábiles. Te envié la guía por correo.",
        ask: "¡Excelente elección! ¿Prefieres pagar con tarjeta, PSE o contraentrega?",
        confirm: "Perfecto. ¿A nombre de quién genero el pedido?",
        done: "Listo, {name}. Te envié el enlace de pago y le avisé al equipo para despachar apenas se confirme.",
        script: ["¿Cuánto tarda el envío a Cali?", "Quiero comprar la vajilla de 16 piezas."],
        slotSugg: "Con tarjeta.", nameSugg: "A nombre de Sebastián Mora",
        sugg: ["¿Dónde está mi pedido?", "¿Puedo devolver un producto?", "¿Tienen tienda física?", "¿Venden muebles?"] },
      en: { label: "E-commerce", biz: "Casa Ceiba", bookLabel: "Buy", agenda: "Catalog and checkout",
        greet: "Hi! I'm Casa Ceiba's assistant. Can I help you find something for your home or with an order?",
        services: "We sell homeware: dinnerware, textiles, lamps and decor. Everything is sold online.",
        price: "16-piece dinnerware sets start at $219,000 and lamps at $149,000.",
        hours: "The online store is open 24/7. Customer service works Monday to Friday from 8:00 a.m. to 6:00 p.m.",
        location: "We're a 100% online store with a warehouse in Bogotá, shipping nationwide.",
        payment: "You can pay by card, PSE or cash on delivery in major cities.",
        shipping: "Shipping to major cities takes 2 to 3 business days and is free on orders over $250,000.",
        returns: "You have 30 days for exchanges or returns if the product is unused and in its original packaging.",
        track: "Happy to check. Could you share your order number?", tracked: "I found order {n}: it left the warehouse today and arrives in 2 business days. I've emailed you the tracking number.",
        ask: "Great choice! Would you like to pay by card, PSE or cash on delivery?",
        confirm: "Perfect. What name should I place the order under?",
        done: "Done, {name}. I've sent you the payment link and let the team know to ship as soon as it's confirmed.",
        script: ["How long does shipping to Cali take?", "I want to buy the 16-piece dinnerware set."],
        slotSugg: "By card.", nameSugg: "Under Sebastián Mora",
        sugg: ["Where is my order?", "Can I return a product?", "Do you have a physical store?", "Do you sell furniture?"] } },

    servicios: { icon: "briefcase", book: "necesito asesoria|asesoria para|agendar|need advice|book a",
      es: { label: "Servicios profesionales", biz: "Estudio Legal Duarte", bookLabel: "Consulta inicial", agenda: "Agenda de abogados",
        greet: "¡Hola! Te atiende el asistente de Estudio Legal Duarte. Cuéntame en qué te podemos ayudar.",
        services: "Asesoramos en constitución de empresas, contratos, temas laborales y propiedad intelectual.",
        price: "La consulta inicial de 30 minutos cuesta $90.000 y se descuenta si contratas el servicio. Los honorarios de cada caso se definen después de la consulta.",
        hours: "Atendemos de lunes a viernes de 8:00 a. m. a 5:00 p. m., en oficina o por videollamada.",
        location: "Nuestra oficina está en el Centro Internacional de Bogotá. También atendemos por videollamada.",
        payment: "Recibimos transferencia y tarjeta. La consulta inicial se paga al agendarla.",
        ask: "Te puedo agendar una consulta inicial. Tengo el martes a las 10:00 a. m. o el miércoles a las 3:00 p. m. ¿Cuál prefieres?",
        confirm: "Perfecto. ¿Me compartes tu nombre y el de tu empresa, si ya la tienes?",
        done: "Gracias, {name}. Agendé tu consulta y le envié al abogado un resumen de tu caso para que llegue preparado.",
        script: ["Necesito asesoría para crear mi empresa.", "El martes me sirve."],
        slotSugg: "El martes me sirve.", nameSugg: "Soy Natalia Peña, de Peña Café",
        sugg: ["¿Cuánto cuesta la consulta?", "¿Atienden por videollamada?", "¿Me garantizan que gano el caso?", "Quiero hablar con un abogado"] },
      en: { label: "Professional services", biz: "Estudio Legal Duarte", bookLabel: "Initial consultation", agenda: "Lawyers' calendar",
        greet: "Hi! This is Estudio Legal Duarte's assistant. Tell me how we can help.",
        services: "We advise on company formation, contracts, employment matters and intellectual property.",
        price: "The 30-minute initial consultation is $90,000 and is credited if you hire us. Fees for each case are set after the consultation.",
        hours: "We work Monday to Friday from 8:00 a.m. to 5:00 p.m., at the office or by video call.",
        location: "Our office is in Centro Internacional, Bogotá. We also meet by video call.",
        payment: "We accept bank transfers and cards. The initial consultation is paid when you book it.",
        ask: "I can book you an initial consultation. I have Tuesday at 10:00 a.m. or Wednesday at 3:00 p.m. Which do you prefer?",
        confirm: "Perfect. Could you share your name and your company's, if you already have one?",
        done: "Thank you, {name}. Your consultation is booked and I've sent the lawyer a summary of your case so they arrive prepared.",
        script: ["I need advice to set up my company.", "Tuesday works for me."],
        slotSugg: "Tuesday works for me.", nameSugg: "I'm Natalia Peña, from Peña Café",
        sugg: ["How much is the consultation?", "Do you meet by video call?", "Can you guarantee I'll win the case?", "I want to talk to a lawyer"] } },

    empresa: { icon: "buildings", book: "cotiz|quote", slots: "\\d|camion|tonelad|semana|mes|truck|week|month",
      es: { label: "Empresa", biz: "Grupo Andino Logística", bookLabel: "Cotizar un servicio", agenda: "CRM comercial",
        greet: "¡Hola! Soy el asistente de Grupo Andino Logística. ¿Quieres cotizar un servicio, rastrear un envío o hablar con un asesor comercial?",
        services: "Ofrecemos transporte de carga nacional, almacenamiento y distribución de última milla para empresas.",
        price: "Las tarifas dependen del volumen, la ruta y la frecuencia. No quiero darte una cifra que no sea real: con unos datos te preparo una cotización formal.",
        hours: "El equipo comercial atiende de lunes a viernes de 7:00 a. m. a 6:00 p. m. La operación funciona 24/7.",
        location: "Tenemos centros de distribución en Bogotá, Medellín y Barranquilla.",
        payment: "Trabajamos con facturación electrónica y crédito a 30 días para clientes aprobados.",
        integrations: "Sí. Podemos integrarnos con tu ERP o enviarte reportes de cada despacho por correo o Google Sheets.",
        track: "Con gusto. ¿Me compartes el número de guía?", tracked: "La guía {n} está en ruta y llega mañana antes del mediodía.",
        ask: "Con gusto. ¿Qué tipo de carga es y con qué frecuencia la despachas?",
        confirm: "Perfecto, con eso el equipo comercial prepara la cotización. ¿Me compartes tu nombre y el de tu empresa?",
        done: "Gracias, {name}. Registré tu solicitud en el CRM y un asesor comercial te envía la cotización hoy.",
        script: ["Necesito cotizar transporte de carga de Bogotá a Barranquilla.", "Son 2 camiones de 10 toneladas cada semana."],
        slotSugg: "Son 2 camiones de 10 toneladas cada semana.", nameSugg: "Soy Carolina Vélez, de Distribuidora Norte",
        sugg: ["Quiero rastrear un envío", "¿Dónde tienen bodegas?", "¿Se integran con nuestro ERP?", "Quiero hablar con un asesor comercial"] },
      en: { label: "Company", biz: "Grupo Andino Logística", bookLabel: "Quote a service", agenda: "Sales CRM",
        greet: "Hi! I'm Grupo Andino Logística's assistant. Would you like a quote, to track a shipment or to talk to a sales advisor?",
        services: "We offer nationwide freight transport, warehousing and last-mile distribution for businesses.",
        price: "Rates depend on volume, route and frequency. I don't want to give you a number that isn't real: with a few details I'll prepare a formal quote.",
        hours: "The sales team works Monday to Friday from 7:00 a.m. to 6:00 p.m. Operations run 24/7.",
        location: "We have distribution centers in Bogotá, Medellín and Barranquilla.",
        payment: "We work with electronic invoicing and 30-day credit for approved customers.",
        integrations: "Yes. We can integrate with your ERP or send you reports for every shipment by email or Google Sheets.",
        track: "Sure. Could you share the tracking number?", tracked: "Shipment {n} is on its way and arrives tomorrow before noon.",
        ask: "Sure. What kind of cargo is it and how often do you ship it?",
        confirm: "Perfect, with that the sales team will prepare the quote. Could you share your name and your company's?",
        done: "Thank you, {name}. I've logged your request in the CRM and a sales advisor will send you the quote today.",
        script: ["I need a quote for freight from Bogotá to Barranquilla.", "It's 2 ten-ton trucks every week."],
        slotSugg: "It's 2 ten-ton trucks every week.", nameSugg: "I'm Carolina Vélez, from Distribuidora Norte",
        sugg: ["I want to track a shipment", "Where are your warehouses?", "Can you integrate with our ERP?", "I want to talk to a sales advisor"] } },

    otro: { icon: "dots-three-outline", book: "automatiz|quiero uno|me interesa|llamada|automate|i want one|interested|call",
      es: { label: "Otro", biz: "Innova AI", bookLabel: "Agendar llamada de diagnóstico", agenda: "Agenda del equipo de Innova",
        greet: "¡Hola! Soy el asistente de Innova AI. Cuéntame qué tipo de negocio tienes y qué te gustaría automatizar.",
        services: "Creamos asistentes de IA para empresas: atienden por WhatsApp, Instagram y tu web, califican clientes, agendan, avisan a tu equipo y se conectan con tus herramientas.",
        price: "El precio depende de lo que necesites automatizar y de las integraciones. Prefiero no darte una cifra inventada: en una llamada corta lo definimos contigo.",
        hours: "Te atiendo a cualquier hora. El equipo de Innova responde de lunes a sábado.",
        location: "Estamos en Colombia y trabajamos con empresas de forma remota.",
        payment: "Las opciones de pago van en la propuesta, según el alcance de tu asistente.",
        integrations: "Sí. Trabaja en WhatsApp, Instagram, Messenger, Telegram y tu web, y se conecta con Google Calendar, Google Sheets, Excel, Gmail, tu CRM y otras herramientas.",
        ask: "¡Se puede! Un asistente puede tomar pedidos, consultar precios y avisarte de cada venta. ¿Agendamos una llamada de diagnóstico de 20 minutos? Puede ser mañana a las 10:00 a. m. o a las 4:00 p. m.",
        confirm: "Perfecto. ¿Me compartes tu nombre y el de tu negocio?",
        done: "Gracias, {name}. Agendé la llamada y le avisé al equipo de Innova. Te escribimos para confirmar.",
        script: ["Tengo una ferretería y quiero automatizar los pedidos por WhatsApp.", "Mañana a las 10."],
        slotSugg: "Mañana a las 10.", nameSugg: "Soy Jorge Ramírez, de Ferretería El Tornillo",
        sugg: ["¿Cuánto cuesta?", "¿Funciona con WhatsApp?", "¿Se conecta con mi Excel?", "Quiero hablar con una persona"] },
      en: { label: "Other", biz: "Innova AI", bookLabel: "Book a discovery call", agenda: "Innova team calendar",
        greet: "Hi! I'm Innova AI's assistant. Tell me what kind of business you have and what you'd like to automate.",
        services: "We build AI assistants for businesses: they answer on WhatsApp, Instagram and your website, qualify customers, book appointments, alert your team and connect to your tools.",
        price: "The price depends on what you need to automate and on the integrations. I'd rather not give you a made-up number: we can define it with you on a short call.",
        hours: "I'm here at any hour. The Innova team replies Monday to Saturday.",
        location: "We're in Colombia and work with companies remotely.",
        payment: "Payment options are in the proposal, based on your assistant's scope.",
        integrations: "Yes. It works on WhatsApp, Instagram, Messenger, Telegram and your website, and connects to Google Calendar, Google Sheets, Excel, Gmail, your CRM and other tools.",
        ask: "It can be done! An assistant can take orders, look up prices and alert you on every sale. Shall we book a 20-minute discovery call? It could be tomorrow at 10:00 a.m. or 4:00 p.m.",
        confirm: "Perfect. Could you share your name and your business's?",
        done: "Thank you, {name}. I've booked the call and let the Innova team know. We'll message you to confirm.",
        script: ["I have a hardware store and want to automate WhatsApp orders.", "Tomorrow at 10."],
        slotSugg: "Tomorrow at 10.", nameSugg: "I'm Jorge Ramírez, from Ferretería El Tornillo",
        sugg: ["How much does it cost?", "Does it work with WhatsApp?", "Does it connect to my Excel?", "I want to talk to a person"] } }
  };
  var ORDER = ["restaurante", "consultorio", "hotel", "agencia", "tienda", "ecommerce", "servicios", "empresa", "otro"];

  var C = {
    es: {
      intent: { greet: "Saludo", price: "Consultar precios", hours: "Consultar horarios", location: "Ubicación", payment: "Medios de pago", shipping: "Envíos", returns: "Cambios y devoluciones", services: "Conocer servicios", integrations: "Integraciones", slot: "Confirmar detalles", name: "Confirmar datos", human: "Hablar con una persona", complaint: "Queja", discount: "Pedir un descuento", urgent: "Urgencia", track: "Estado de un pedido", tracked: "Estado de un pedido", lang: "Cambio de idioma", thanks: "Agradecimiento", no: "Cambiar opción", unknown: "Pregunta fuera de la información disponible", promise: "Pedir una garantía" },
      data: { greet: "Perfil del negocio", price: "Lista de precios", hours: "Horarios", location: "Datos del negocio", payment: "Políticas de pago", shipping: "Políticas de envío", returns: "Políticas de cambios", services: "Catálogo de servicios", integrations: "Integraciones disponibles", human: "Reglas de escalamiento", complaint: "Reglas de escalamiento", discount: "Políticas comerciales", urgent: "Reglas de escalamiento", track: "Sistema de pedidos", tracked: "Sistema de pedidos", lang: "Idiomas configurados", thanks: "Historial de la conversación", no: "Agenda", unknown: "Sin dato en la base", promise: "Políticas del negocio", name: "Agenda y CRM" },
      decision: { greet: "Saludar y ofrecer ayuda", price: "Responder con el precio oficial", hours: "Responder con el horario real", location: "Compartir la ubicación", payment: "Explicar los medios de pago", shipping: "Explicar tiempos y costos de envío", returns: "Explicar la política de cambios", services: "Explicar lo que ofrece el negocio", integrations: "Explicar las integraciones", book: "Ofrecer opciones reales", slot: "Apartar y pedir datos", name: "Confirmar y avisar al equipo", human: "Transferir a una persona", complaint: "Disculparse y escalar", discount: "No prometer lo que no está autorizado", urgent: "No diagnosticar; escalar con prioridad", track: "Pedir el número para consultar", tracked: "Consultar el sistema y responder", lang: "Cambiar de idioma", thanks: "Cerrar con amabilidad", no: "Ofrecer otra opción", unknown: "No inventar; ofrecer pasar con una persona", promise: "No hacer promesas; aclarar" },
      human: { no: "No", yes: "Sí, lo pidió el cliente", ifAsks: "Solo si el cliente quiere", urgent: "Sí, con prioridad", complaint: "Sí: es una queja", soon: "Sí, para cerrar la venta" },
      a: { reply: "Respuesta enviada", looked: "Información consultada", agenda: "Disponibilidad consultada", held: "Opción apartada", booked: "Registro creado", lead: "Cliente calificado: listo para avanzar", notify: "Aviso enviado al equipo", handoff: "Conversación transferida a una persona", summary: "Resumen del caso enviado al equipo", noInvent: "No se inventó la respuesta", priority: "Marcado como prioritario" },
      opp: "Oportunidad detectada: cliente listo para avanzar",
      tryNow: "Ahora escribe tú. Pregunta lo que quieras, incluso algo que el negocio no tenga en su información.",
      reply: {
        human: "Claro. Ya le aviso a una persona del equipo para que continúe esta conversación contigo. Te responde en este mismo chat.",
        complaint: "Lamento lo que pasó. Le paso tu caso ahora mismo a una persona del equipo para que lo resuelva contigo.",
        discount: "No tengo autorización para ofrecer descuentos que no están en nuestras políticas. Si quieres, le paso tu solicitud a un asesor para que te responda.",
        urgent: "Siento que estés pasando por eso. No puedo darte un diagnóstico, así que le aviso ahora a una persona del equipo para que te atienda con prioridad.",
        promise: "No puedo prometerte un resultado. Lo que sí puedo hacer es agendarte con el equipo para que revise tu caso con detalle.",
        lang: "Of course! I can help you in English too. What would you like to know?",
        thanks: "¡Con gusto! Si necesitas algo más, aquí estoy.",
        no: "Sin problema. Dime qué otra opción te sirve y la reviso.",
        unknown: "No tengo ese dato confirmado en la información del negocio y prefiero no inventarlo. ¿Quieres que le pase tu pregunta a una persona del equipo?",
        noTrack: "Para consultarlo necesito el número. ¿Me lo compartes?",
        declined: "Entendido. ¿Te ayudo con algo más?"
      }
    },
    en: {
      intent: { greet: "Greeting", price: "Ask about prices", hours: "Ask about hours", location: "Location", payment: "Payment methods", shipping: "Shipping", returns: "Exchanges and returns", services: "Learn about services", integrations: "Integrations", slot: "Confirm details", name: "Confirm details", human: "Talk to a person", complaint: "Complaint", discount: "Ask for a discount", urgent: "Urgent", track: "Order status", tracked: "Order status", lang: "Language change", thanks: "Thanks", no: "Change option", unknown: "Question outside the available information", promise: "Ask for a guarantee" },
      data: { greet: "Business profile", price: "Price list", hours: "Opening hours", location: "Business details", payment: "Payment policies", shipping: "Shipping policies", returns: "Returns policy", services: "Service catalog", integrations: "Available integrations", human: "Escalation rules", complaint: "Escalation rules", discount: "Commercial policies", urgent: "Escalation rules", track: "Order system", tracked: "Order system", lang: "Configured languages", thanks: "Conversation history", no: "Calendar", unknown: "Not in the knowledge base", promise: "Business policies", name: "Calendar and CRM" },
      decision: { greet: "Greet and offer help", price: "Answer with the official price", hours: "Answer with the real hours", location: "Share the location", payment: "Explain payment methods", shipping: "Explain shipping times and costs", returns: "Explain the returns policy", services: "Explain what the business offers", integrations: "Explain the integrations", book: "Offer real options", slot: "Hold it and ask for details", name: "Confirm and alert the team", human: "Hand off to a person", complaint: "Apologize and escalate", discount: "Don't promise what isn't authorized", urgent: "Don't diagnose; escalate with priority", track: "Ask for the number to look it up", tracked: "Check the system and reply", lang: "Switch language", thanks: "Close politely", no: "Offer another option", unknown: "Don't make it up; offer a person", promise: "Make no promises; clarify" },
      human: { no: "No", yes: "Yes, the customer asked", ifAsks: "Only if the customer wants", urgent: "Yes, with priority", complaint: "Yes: it's a complaint", soon: "Yes, to close the sale" },
      a: { reply: "Reply sent", looked: "Information looked up", agenda: "Availability checked", held: "Option held", booked: "Record created", lead: "Customer qualified: ready to move forward", notify: "Team alerted", handoff: "Conversation handed to a person", summary: "Case summary sent to the team", noInvent: "No answer was made up", priority: "Marked as priority" },
      opp: "Opportunity detected: customer ready to move forward",
      tryNow: "Now it's your turn. Ask anything, even something the business doesn't have in its information.",
      reply: {
        human: "Of course. I'm letting someone on the team know so they can continue this conversation with you. They'll reply in this same chat.",
        complaint: "I'm sorry about what happened. I'm passing your case to someone on the team right now so they can sort it out with you.",
        discount: "I'm not authorized to offer discounts that aren't in our policies. If you'd like, I can pass your request to an advisor.",
        urgent: "I'm sorry you're going through that. I can't give you a diagnosis, so I'm alerting someone on the team to help you as a priority.",
        promise: "I can't promise you an outcome. What I can do is book you with the team so they can review your case in detail.",
        lang: "¡Claro! También te atiendo en español. ¿Qué te gustaría saber?",
        thanks: "You're welcome! If you need anything else, I'm here.",
        no: "No problem. Tell me which other option works for you and I'll check.",
        unknown: "I don't have that confirmed in the business's information and I'd rather not make it up. Would you like me to pass your question to someone on the team?",
        noTrack: "I need the number to look it up. Could you share it?",
        declined: "Understood. Can I help you with anything else?"
      }
    }
  };

  var RX = {
    human: /hablar con (un|una|el|la|alguien|algun)?\s*(asesor|persona|humano|abogad|agente|ejecutiv|alguien)|persona real|con un humano|talk to (a|an|someone|the)?\s*(person|human|advisor|agent|lawyer|sales|someone)|real person|speak to (a|an)/,
    complaint: /queja|reclamo|pesimo|mal servicio|molest|complaint|terrible|awful|angry/,
    discount: /descuento|rebaja|promocion|mas barato|discount|cheaper|deal/,
    urgent: /duele|dolor|urgen|sangr|emergencia|hurts|pain|emergency|bleeding/,
    promise: /garantiz|garantia de que|aseguran que|guarantee/,
    lang: /\bingles\b|\benglish\b|hablan espanol|\bspanish\b|speak english|espanol\?/,
    track: /donde esta mi|mi pedido|estado de|rastre|seguimiento|numero de guia|\bguia\b|where is my|track|order status/,
    returns: /devolu|devolver|cambio de|cambiar (una|un|el|la)|return|exchange|refund/,
    shipping: /envio|enviar|domicilio|despacho a|llega a|tarda|ship|delivery|deliver/,
    price: /precio|cuesta|cuanto|valor|tarifa|cobran|price|cost|how much|rate|fee/,
    hours: /horario|hora abren|abren|cierran|abierto|atienden (los|el|en)|check-in|check in|que hora|hours|open|close|what time/,
    location: /donde|ubicacion|direccion|bodega|sede|tienda fisica|videollamada|virtual|where|address|location|warehouse|video call|physical store/,
    payment: /pago|pagar|tarjeta|transferencia|nequi|cuota|efectivo|\bpay|card|installment|cash/,
    integrations: /integr|conecta|whatsapp|excel|erp|crm|sheets|connect/,
    services: /servicio|ofrecen|menu|catalogo|producto|incluye|venden|tratamiento|desayuno|service|offer|menu|catalog|product|include|sell|breakfast/,
    book: /reserv|cita|agend|disponibilidad|cupo|mesa|habitacion|turno|comprar|quiero (el|la|los|las|un|una)|pedido|book|appointment|availability|table|room|reservation|buy|order/,
    thanks: /gracias|thank/,
    greet: /^(hola|buenas|buenos|buen dia|hey|hi|hello|good (morning|afternoon|evening))\b/,
    yes: /^(si|sii|claro|dale|listo|ok|okay|de una|perfecto|yes|sure|yep)\b/,
    no: /^(no|nop|ninguna|ninguno|nope)\b/,
    namePrefix: /^(me llamo|mi nombre es|soy|a nombre de|nombre:|my name is|i'm|i am|under|name:)\s*/i
  };

  function ctx(industry, lang) { return KB[industry][lang] || KB[industry].es; }

  function Simulated() { this.state = {}; }
  Simulated.prototype.reset = function () { this.state = {}; };
  Simulated.prototype.reply = function (o) {
    var self = this;
    return new Promise(function (resolve) { resolve(self._reply(o)); });
  };
  Simulated.prototype._reply = function (o) {
    var k = KB[o.industry], d = ctx(o.industry, o.lang), c = C[o.lang] || C.es, t = norm(o.message).trim();
    var st = this.state, A = c.a, intent = null;
    t = t.replace(/^[¿¡\s]+/, "");
    var isQuestion = /\?|^(que|cual|como|cuanto|donde|cuando|tienen|hay|what|which|how|where|when|do|does|is|are|can)\b/.test(t);

    // 1. Conversación en curso
    if (st.awaiting === "handoff" && RX.yes.test(t)) intent = "human";
    else if (st.awaiting === "handoff" && RX.no.test(t)) intent = "declined";
    else if (st.awaiting === "order" && /\d/.test(t)) intent = "tracked";
    else if (st.awaiting === "name" && !isQuestion && t.length > 1 && !RX.human.test(t)) intent = "name";
    else if (st.awaiting === "slot" && !isQuestion && (RX.no.test(t))) intent = "no";
    else if (st.awaiting === "slot" && !isQuestion && (/\d/.test(t) || RX.yes.test(t) || (k.slots && new RegExp(k.slots).test(t)) || /lunes|martes|miercoles|jueves|viernes|sabado|domingo|manana|monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow/.test(t))) intent = "slot";

    // 2. Intenciones nuevas (las que piden una persona o un límite van primero)
    if (!intent) {
      // "bizBook": frases de compra propias de cada industria; "book": las genéricas, casi al final.
      var order = ["human", "complaint", "urgent", "discount", "promise", "lang", "track", "bizBook", "returns", "shipping", "price", "payment", "hours", "location", "integrations", "services", "book", "thanks", "greet"];
      for (var i = 0; i < order.length; i++) {
        var key = order[i];
        if (key === "bizBook") {
          if (k.book && new RegExp(k.book).test(t)) { intent = "book"; break; }
        } else if (RX[key].test(t)) { intent = key; break; }
      }
    }
    if (intent === "track" && !d.track) intent = "unknown";
    if ((intent === "shipping" && !d.shipping) || (intent === "returns" && !d.returns) || (intent === "integrations" && !d.integrations)) intent = "unknown";
    if (!intent) intent = "unknown";

    var res = { analysis: { intent: c.intent[intent] || d.bookLabel, data: c.data[intent] || d.agenda, decision: c.decision[intent], human: c.human.no }, actions: [], hot: false };
    var reply;
    switch (intent) {
      case "greet": reply = d.greet; res.actions.push(["chat-circle-text", A.reply]); break;
      case "book":
        reply = d.ask; st.awaiting = "slot";
        res.analysis.intent = d.bookLabel; res.analysis.data = d.agenda;
        res.actions.push(["calendar-check", A.agenda], ["chat-circle-text", A.reply]); break;
      case "slot":
        reply = d.confirm; st.awaiting = "name";
        res.analysis.data = d.agenda;
        res.actions.push(["check-circle", A.held]); break;
      case "no": reply = c.reply.no; break;
      case "declined": reply = c.reply.declined; st.awaiting = null; res.analysis.intent = c.intent.thanks; res.analysis.decision = c.decision.thanks; break;
      case "name":
        var name = o.message.trim().replace(RX.namePrefix, "").replace(/[.!]+$/, "");
        name = name.length > 60 ? name.slice(0, 60) : name;
        reply = d.done.replace("{name}", name); st.awaiting = null;
        res.analysis.intent = d.bookLabel; res.analysis.human = c.human.soon; res.hot = true;
        res.actions.push(["calendar-check", A.booked], ["funnel", A.lead, true], ["bell-ringing", A.notify, true]); break;
      case "track": reply = d.track; st.awaiting = "order"; res.actions.push(["magnifying-glass", A.looked]); break;
      case "tracked":
        var n = (o.message.match(/[\w-]*\d[\w-]*/) || [""])[0];
        reply = d.tracked.replace("{n}", n); st.awaiting = null; res.actions.push(["magnifying-glass", A.looked], ["chat-circle-text", A.reply]); break;
      case "human": reply = c.reply.human; st.awaiting = null; res.analysis.human = c.human.yes; res.actions.push(["headset", A.handoff, true], ["list-checks", A.summary]); break;
      case "complaint": reply = c.reply.complaint; res.analysis.human = c.human.complaint; res.actions.push(["headset", A.handoff, true], ["warning-circle", A.priority]); break;
      case "urgent": reply = c.reply.urgent; res.analysis.human = c.human.urgent; res.actions.push(["warning-circle", A.priority, true], ["headset", A.handoff, true]); break;
      case "discount": reply = c.reply.discount; st.awaiting = "handoff"; res.analysis.human = c.human.ifAsks; res.analysis.warn = true; res.actions.push(["shield-check", A.noInvent]); break;
      case "promise": reply = c.reply.promise; res.analysis.human = c.human.ifAsks; res.analysis.warn = true; res.actions.push(["shield-check", A.noInvent]); break;
      case "lang": reply = c.reply.lang; break;
      case "thanks": reply = c.reply.thanks; break;
      case "unknown":
        reply = c.reply.unknown; st.awaiting = "handoff"; res.analysis.human = c.human.ifAsks; res.analysis.warn = true;
        res.actions.push(["shield-check", A.noInvent]); break;
      default:
        reply = d[intent]; res.actions.push(["magnifying-glass", A.looked], ["chat-circle-text", A.reply]);
    }
    res.reply = reply;
    res.awaiting = st.awaiting || null;
    return res;
  };

  function Remote(endpoint) { this.endpoint = endpoint; this.fallback = new Simulated(); this.history = []; }
  Remote.prototype.reset = function () { this.history = []; this.fallback.reset(); };
  Remote.prototype.reply = function (o) {
    var self = this;
    var body = JSON.stringify({ industry: o.industry, lang: o.lang, message: o.message, history: self.history.slice(-12) });
    return fetch(self.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: body })
      .then(function (r) { if (!r.ok) throw new Error("http_" + r.status); return r.json(); })
      .then(function (d) {
        if (!d || typeof d.reply !== "string") throw new Error("bad_response");
        self.history.push({ role: "user", text: o.message }, { role: "assistant", text: d.reply });
        return { reply: d.reply, analysis: d.analysis || {}, actions: d.actions || [], hot: !!d.hot, awaiting: null };
      })
      .catch(function () { return self.fallback.reply(o); });
  };

  return {
    order: ORDER,
    info: function (industry, lang) { var d = ctx(industry, lang); return { icon: KB[industry].icon, label: d.label, biz: d.biz, greet: d.greet, script: d.script, sugg: d.sugg, slotSugg: d.slotSugg, nameSugg: d.nameSugg }; },
    common: function (lang) { return C[lang] || C.es; },
    create: function () { return window.INNOVA_DEMO_ENDPOINT ? new Remote(window.INNOVA_DEMO_ENDPOINT) : new Simulated(); }
  };
})();
