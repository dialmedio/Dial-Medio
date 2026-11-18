/**
 * Fotos libres para la capa cinematográfica del sitio (18 nov 2026). Todas de Unsplash (licencia Unsplash: uso
 * comercial libre, sin obligación de crédito; lo damos igual). Reveladas con la película de la casa
 * (dial_noticias.pelicula, fuerza 0.85, grano 0.7) en src/assets/cine.
 * Son imagen de ambiente: NO son trabajo de Dial y nunca van en /trabajo ni como portafolio.
 * Línea documental tomada del moodboard «De la amapola a la fresa» (páramo, figura pequeña, retrato que mira);
 * línea comercial: set, luz, escenario.
 */
import type { ImageMetadata } from 'astro';
import paramoFigura from '../assets/cine/paramo-figura.jpg';
import palmasNiebla from '../assets/cine/palmas-niebla.jpg';
import retratoAndino from '../assets/cine/retrato-andino.jpg';
import manos from '../assets/cine/manos.jpg';
import campoCiudad from '../assets/cine/campo-ciudad.jpg';
import ancianaColina from '../assets/cine/anciana-colina.jpg';
import lagunaParamo from '../assets/cine/laguna-paramo.jpg';
import camaraLuz from '../assets/cine/camara-luz.jpg';
import setAzul from '../assets/cine/set-azul.jpg';
import concierto from '../assets/cine/concierto.jpg';
import salaMusica from '../assets/cine/sala-musica.jpg';
import direccion from '../assets/cine/direccion.jpg';
import estudioFoto from '../assets/cine/estudio-foto.jpg';
import setRodaje from '../assets/cine/set-rodaje.jpg';
import chef from '../assets/cine/chef.jpg';
import emplatado from '../assets/cine/emplatado.jpg';
import afiche from '../assets/cine/afiche.jpg';
import celular from '../assets/cine/celular.jpg';
import barista from '../assets/cine/barista.jpg';
import carta from '../assets/cine/carta.jpg';
import moda from '../assets/cine/moda.jpg';

export type Foto = { src: ImageMetadata; alt: string; autor: string; lugar?: string; foco?: string };

export const FOTOS = {
  paramoFigura: { src: paramoFigura, alt: 'Una mujer con poncho mira el páramo junto a una llama', autor: 'Terra Sur Travels', lugar: 'Andes de Ecuador', foco: '62% 50%' },
  palmasNiebla: { src: palmasNiebla, alt: 'Palmas de cera que salen de la niebla en una ladera', autor: 'Miguel Ángel Pinto', lugar: 'Colombia' },
  retratoAndino: { src: retratoAndino, alt: 'Retrato de una mujer andina con traje tradicional bajo el cielo', autor: 'Gustavo Leighton', foco: '50% 30%' },
  manos: { src: manos, alt: 'Manos de una persona mayor trabajando un objeto pequeño', autor: 'Breno Fabrício' },
  campoCiudad: { src: campoCiudad, alt: 'Un campesino camina con su herramienta al hombro; al fondo, la ciudad', autor: 'Alon Ezer', foco: '60% 50%' },
  ancianaColina: { src: ancianaColina, alt: 'Una mujer mayor descansa con su bastón en una colina soleada', autor: 'Natasha Ruf', lugar: 'San Pablo de Tiquina, Bolivia', foco: '45% 40%' },
  lagunaParamo: { src: lagunaParamo, alt: 'Laguna de páramo bajo la niebla', autor: 'Michael Lechner', lugar: 'Colombia' },
  camaraLuz: { src: camaraLuz, alt: 'Cámara de cine sobre trípode con luces rojas desenfocadas detrás', autor: 'SanDisk', foco: '45% 50%' },
  setAzul: { src: setAzul, alt: 'Camarógrafo filmando en un set con luz azul', autor: 'Kyle Loftus' },
  concierto: { src: concierto, alt: 'Un músico frente al público iluminado, en blanco y negro', autor: 'Chase Fade', foco: '50% 40%' },
  salaMusica: { src: salaMusica, alt: 'Sala de música con batería, micrófono y humo a contraluz', autor: 'John Matychuk' },
  direccion: { src: direccion, alt: 'Un director habla con el camarógrafo junto a una ventana', autor: 'Jakob Owens' },
  estudioFoto: { src: estudioFoto, alt: 'Estudio con fondo blanco, luces y softbox', autor: 'Alexander Dummer' },
  setRodaje: { src: setRodaje, alt: 'Equipo de rodaje trabajando en un estudio grande', autor: 'Brands&People' },
  // Campañas (18 nov 2026, tarde): restaurantes, cafés, redes y marcas.
  chef: { src: chef, alt: 'Un cocinero saltea con fuego en la cocina de un restaurante', autor: 'Johnathan Macedo', foco: '60% 45%' },
  emplatado: { src: emplatado, alt: 'Manos que emplatan en una cocina en penumbra', autor: 'Fabrizio Magoni', lugar: 'Crevalcore, Italia' },
  afiche: { src: afiche, alt: 'Un afiche en una pared con luz de ventana', autor: 'mottss designco' },
  celular: { src: celular, alt: 'Una mano sostiene un celular con un perfil de Instagram en la ciudad', autor: 'Jakob Owens', foco: '50% 40%' },
  barista: { src: barista, alt: 'Una barista sirve arte latte en una taza', autor: 'Brooke Cagle' },
  carta: { src: carta, alt: 'Una carta de restaurante sobre la mesa junto a una taza', autor: 'Annie Spratt' },
  moda: { src: moda, alt: 'Una maquilladora prepara a una modelo en un estudio blanco', autor: 'Vitaly Gariev' },
} satisfies Record<string, Foto>;

export const credito = (f: Foto) => `${f.lugar ? f.lugar + ' · ' : ''}Foto: ${f.autor} / Unsplash`;

/** Imagen de cada servicio en /servicios. En la portada, Campañas muestra láminas propias sobre el afiche. */
export const FOTO_SERVICIO: Record<string, Foto> = {
  documental: FOTOS.campoCiudad,
  publicidad: FOTOS.estudioFoto,
  musica: FOTOS.salaMusica,
  eventos: FOTOS.concierto,
  divulgacion: FOTOS.manos,
  diseno: FOTOS.chef,
};
