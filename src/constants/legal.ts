export type LegalSection = {
  title: string;
  paragraphs: string[];
  links?: Array<{ label: string; href: string }>;
};

export const TERMS_OF_SERVICE = {
  title: "Términos del servicio",
  description: "Términos del servicio de Eclipze.",
  intro:
    "Estos términos describen el acceso a Eclipze, un espacio de trabajo para comunicación de proyectos, issues, repositorios y tareas de desarrollo asistidas por IA.",
  sections: [
    {
      title: "Responsable y alcance",
      paragraphs: [
        "Eclipze es operado por Jose Rafael Martinez Bocanegra desde Nuevo León, México. Falta confirmar el domicilio completo del servicio y revisar las cláusulas finales de jurisdicción y solución de controversias antes de considerar estos términos como un acuerdo definitivo.",
        "Al crear una cuenta, aceptas estos términos y el Aviso de privacidad. Se respetan los derechos irrenunciables que establezca la legislación aplicable.",
      ],
    },
    {
      title: "Cuentas y seguridad",
      paragraphs: [
        "Proporciona un correo electrónico válido, verifícalo cuando se te solicite y mantén en privado tu contraseña y enlaces de acceso. Eres responsable de la actividad realizada con tu cuenta. Contacta pronto al responsable si crees que alguien accedió a ella sin autorización.",
      ],
    },
    {
      title: "Contenido del espacio de trabajo",
      paragraphs: [
        "Eres responsable de los proyectos, descripciones de issues, mensajes, direcciones de repositorios, prompts, skills y demás contenido que agregues a Eclipze. Comparte únicamente contenido que tengas derecho a usar y proporcionar para la función que elijas.",
        "Eclipze procesa el contenido para ofrecer las funciones solicitadas. Evita incluir contraseñas, secretos de API o información confidencial, salvo que una función los requiera y tengas autorización para compartirlos.",
      ],
    },
    {
      title: "IA y servicios conectados",
      paragraphs: [
        "Al iniciar una tarea de IA, el prompt y el contenido de las skills seleccionadas se envían a OpenRouter para procesar la solicitud. Otros servicios conectados pueden recibir la información necesaria para brindar una función que solicites. Cada proveedor aplica sus propios términos y aviso de privacidad.",
        "Eclipze no vende ni renta tus datos personales. Las claves de proveedores de IA se cifran antes de guardarse. Eres responsable de elegir proveedores apropiados y de enviar contenido que tengas autorización para compartir con ellos.",
      ],
    },
    {
      title: "Uso aceptable",
      paragraphs: [
        "Usa Eclipze conforme a la legislación aplicable y dentro de tus autorizaciones. No intentes acceder a la cuenta o espacio de trabajo de otra persona, interferir con el servicio ni usar servicios conectados de forma que infrinja sus términos.",
      ],
    },
    {
      title: "Cambios y eliminación de cuenta",
      paragraphs: [
        "El responsable puede actualizar el servicio o estos términos. Los cambios se reflejarán en esta página con una fecha de actualización.",
        "La eliminación de cuenta puede solicitarse desde la configuración cuando la cuenta tenga al menos 30 días y se cumplan las verificaciones del producto. La aplicación elimina la cuenta y sus registros relacionados en la base de datos; los plazos de conservación en respaldos y sistemas de terceros aún deben documentarse.",
      ],
    },
    {
      title: "Contacto",
      paragraphs: [
        "Para preguntas sobre estos términos, escribe a Jose Rafael Martinez Bocanegra en contact@ravexcode.com. Este documento sigue siendo un borrador hasta confirmar el domicilio completo del responsable y revisar la redacción legal final.",
      ],
    },
  ] satisfies LegalSection[],
};

export const PRIVACY_NOTICE = {
  title: "Aviso de privacidad",
  description: "Aviso de privacidad de Eclipze.",
  intro:
    "Este aviso explica qué datos personales maneja Eclipze, para qué los utiliza y qué proveedores reciben información para ofrecer las funciones que solicitas.",
  sections: [
    {
      title: "Responsable",
      paragraphs: [
        "El responsable del tratamiento es Jose Rafael Martinez Bocanegra, operador de Eclipze en Nuevo León, México. Para preguntas o solicitudes de privacidad, escribe a contact@ravexcode.com. Falta agregar el domicilio completo del servicio antes de considerar terminado este aviso.",
      ],
    },
    {
      title: "Datos que maneja la aplicación",
      paragraphs: [
        "La cuenta incluye datos como correo electrónico, nombre de usuario, avatar opcional, hash de contraseña, rol y fechas de actividad. La aplicación también guarda sesiones de acceso y códigos de verificación o recuperación en forma de hashes.",
        "El espacio de trabajo puede contener proyectos, issues, mensajes, notificaciones, direcciones de repositorios, configuración de agentes, prompts, skills seleccionadas y actividad de tareas. El contenido libre que decidas enviar podría incluir datos personales o confidenciales.",
        "La aplicación no solicita intencionalmente categorías de datos personales sensibles como campos de cuenta. Sin embargo, podrías incluir ese tipo de información en mensajes, issues o prompts de texto libre; evita hacerlo salvo que sea necesario y tengas autorización.",
        "Un correo de seguridad tras iniciar sesión puede incluir la dirección IP observada en esa solicitud, una descripción del navegador y dispositivo, y la hora de acceso. Resend entrega ese correo.",
      ],
    },
    {
      title: "Finalidades",
      paragraphs: [
        "Los datos se usan para crear y proteger cuentas; verificar correos y recuperar contraseñas; ofrecer proyectos, issues, mensajes, repositorios, agentes y otras funciones; procesar tareas de IA que inicies; enviar comunicaciones de servicio y seguridad; y mantener y proteger el servicio.",
        "Eclipze incluye Vercel Analytics para entender el uso del servicio. El operador debe confirmar los eventos exactos y los plazos de conservación configurados para analítica.",
      ],
    },
    {
      title: "Venta, proveedores y transferencias",
      paragraphs: [
        "Eclipze no vende ni renta datos personales. Solo comparte información con proveedores cuando es necesario para operar una función o entregar una comunicación que solicites.",
        "Al iniciar una tarea de IA, el prompt y el contenido de las skills seleccionadas se envían a OpenRouter. Resend entrega correos de cuenta y seguridad. Vercel proporciona analítica. Es posible contactar API de proveedores para validar o usar una conexión de IA. Los proveedores de alojamiento y base de datos también procesan información necesaria para operar la aplicación; falta confirmar sus identidades, ubicaciones y plazos de conservación.",
        "Algunos proveedores podrían procesar información fuera de México. El operador debe confirmar destinos y condiciones de transferencia antes de publicar el aviso. Cada proveedor puede tratar los datos recibidos conforme a sus propios términos y avisos de privacidad.",
      ],
    },
    {
      title: "Seguridad y acceso",
      paragraphs: [
        "La aplicación genera hashes de contraseñas con scrypt y guarda como hashes los secretos de sesión y verificación. Las claves de API de proveedores de IA se cifran con AES-256-GCM antes de guardarse.",
        "Otros campos de la base de datos —incluidos correo y nombre de usuario, contenido de issues y mensajes, direcciones de repositorios y prompts de agentes— no están cifrados campo por campo por la aplicación. El rol Developer puede consultar algunos identificadores de cuenta y registros de issues para operar el servicio; por eso Eclipze no puede afirmar que ningún desarrollador pueda ver jamás datos de usuario. El acceso está sujeto a los permisos por rol y espacio de trabajo implementados en la aplicación.",
      ],
    },
    {
      title: "Conservación y eliminación",
      paragraphs: [
        "La eliminación de cuenta puede solicitarse desde la configuración cuando la cuenta tenga al menos 30 días y se cumplan las verificaciones del producto. La aplicación elimina la cuenta y los registros relacionados en la base de datos. Aún deben documentarse la conservación de respaldos, registros de infraestructura, analítica y datos en manos de proveedores.",
      ],
    },
    {
      title: "Tus derechos y solicitudes de privacidad",
      paragraphs: [
        "Conforme a la legislación mexicana aplicable, puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos personales (derechos ARCO). Escribe a contact@ravexcode.com con tu nombre, correo de la cuenta, el derecho que deseas ejercer y suficiente detalle para localizar los datos. El responsable puede pedir información necesaria para verificar tu identidad o aclarar la solicitud.",
        "La Ley Federal de Protección de Datos Personales en Posesión de los Particulares establece el marco para los responsables privados. La ley de Nuevo León se refiere a datos en posesión de sujetos obligados del sector público; el domicilio del operador en Nuevo León, por sí solo, no convierte a Eclipze en un sujeto obligado.",
      ],
      links: [
        {
          label: "Ley Federal (Cámara de Diputados, texto vigente)",
          href: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
        },
        {
          label: "Ley de Nuevo León (Compilación Legislativa del Estado)",
          href: "https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC_0001_0002_0168084-0000001.pdf",
        },
        {
          label: "Gobierno de Nuevo León: tratamiento de datos personales",
          href: "https://nl.gob.mx/es/sobre-tratamiento-datos-personales",
        },
      ],
    },
    {
      title: "Actualizaciones",
      paragraphs: [
        "Los cambios a este aviso se publicarán aquí con una nueva fecha de actualización. Este aviso tiene fecha del 2 de octubre de 2026. Falta confirmar el domicilio del servicio, la lista y ubicación de proveedores, los periodos de conservación y la revisión legal final.",
      ],
    },
  ] satisfies LegalSection[],
};
