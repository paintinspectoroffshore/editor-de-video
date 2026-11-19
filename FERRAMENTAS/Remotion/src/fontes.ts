import { loadFont as loadArchivo } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadYellowtail } from "@remotion/google-fonts/Yellowtail";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadBarlow } from "@remotion/google-fonts/BarlowCondensed";

// Só os pesos e alfabetos usados (antes baixava TODOS: ~270 requisições por aba e render lento).
const sub = { subsets: ["latin", "latin-ext"] as ("latin" | "latin-ext")[] };
loadArchivo("normal", sub);
loadInter("normal", { weights: ["500", "600", "700", "800", "900"], ...sub });
loadMono("normal", { weights: ["400", "500", "700"], ...sub });
// Estilo Crônica: serif editorial (títulos, legenda e notas em itálico)
loadFraunces("normal", { weights: ["800"], ...sub });
loadFraunces("italic", { weights: ["600"], ...sub });
// Estilo Leonida: display condensada (títulos, números, legenda) + script de letreiro neon
loadAnton("normal", { weights: ["400"], ...sub });
loadYellowtail("normal", { weights: ["400"], ...sub });
// Estilo Traço (ref. 79): termo-chave em serifa itálica (titulo serifa:true)
loadInstrument("italic", { weights: ["400"], ...sub });
// Acento industrial (fonteAcento:"industrial"): condensada itálica de placa técnica/sinalização
loadBarlow("italic", { weights: ["600"], ...sub });
