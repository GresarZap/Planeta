import { Cubo } from './cuboColor.js';
import { Esfera } from './esfera.js';
import { Esfera2 } from './esfera2.js';
import { Cilindro } from './cilindro.js';
import { Cilindro2 } from './cilindro2.js';
import { ArcBall } from './arcBall.js';
import { Cuaternion } from './cuaternion.js';
import { ortho, identidad, escalacion, multiplica, rotacionZ, rotacionY, rotacionX, traslacion } from './matrices.js';

import { getArbolesData } from './arbol.js';
import { Esfera3 } from './esfera3.js';
import { Esfera4 } from './esfera4.js';

/* Variables globales */
let canvas;
let programaID;
let gl;
let cubo;
let tierra;
let cilindro;
let cilindro2;
let arcBall;

let arbolesData;
let arboles;
let nubesData;
let nubes;
let floresData;
let flores;

/* Variables Uniformes */
let uMatrizProyeccion;
let uMatrizVista;
let uMatrizModelo;

/* Matrices */
let MatrizProyeccion = new Array(16);
let MatrizVista = new Array(16);
let MatrizModelo = new Array(16);

/* Para la interacción */
let MatrizRotacion = new Array(16);
let Matriz = new Array(16);
let boton_izq_presionado = false;

/***************************************************************************/
/* Se crean, compilan y enlazan los programas Shader                       */
/***************************************************************************/
function compilaEnlazaLosShaders() {

    /* Se compila el shader de vertice */
    var shaderDeVertice = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shaderDeVertice, document.getElementById("vs").text.trim());
    gl.compileShader(shaderDeVertice);
    if (!gl.getShaderParameter(shaderDeVertice, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shaderDeVertice));
    }

    /* Se compila el shader de fragmento */
    var shaderDeFragmento = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shaderDeFragmento, document.getElementById("fs").text.trim());
    gl.compileShader(shaderDeFragmento);
    if (!gl.getShaderParameter(shaderDeFragmento, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shaderDeFragmento));
    }

    /* Se enlaza ambos shader */
    programaID = gl.createProgram();
    gl.attachShader(programaID, shaderDeVertice);
    gl.attachShader(programaID, shaderDeFragmento);
    gl.linkProgram(programaID);
    if (!gl.getProgramParameter(programaID, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(programaID));
    }

    /* Se instala el programa de shaders para utilizarlo */
    gl.useProgram(programaID);
}

/***************************************************************************/
/* Eventos del Ratón                                                       */
/***************************************************************************/

function mouseDown(event) {
    var posx = new Number();
    var posy = new Number();

    /* Obtiene la coordenada dentro de la área mayor */
    if (event.x != undefined && event.y != undefined) {
        posx = event.x;
        posy = event.y;
    } else {
        posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    /* Obtiene la coordenada dentro del canvas */
    posx = posx - canvas.offsetLeft;
    posy = posy - canvas.offsetTop;

    /* Matriz = MatrizRotacion */
    Matriz = MatrizRotacion.slice(); /* Copia */
    arcBall.primerPunto(posx, posy);

    boton_izq_presionado = true;

    return false;
};

function mouseUp(e) {
    boton_izq_presionado = false;
};

function mouseMove(event) {
    if (!boton_izq_presionado)
        return false;

    var posx = new Number();
    var posy = new Number();

    /* Obtiene la coordenada dentro de la área mayor */
    if (event.x != undefined && event.y != undefined) {
        posx = event.x;
        posy = event.y;
    } else {
        posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    /* Obtiene la coordenada dentro del canvas */
    posx = posx - canvas.offsetLeft;
    posy = posy - canvas.offsetTop;

    /* Actualiza el segundo vector y obtiene el cuaternión */
    let q = arcBall.segundoPunto(posx, posy);

    /* Convierte el cuaternión a una matriz de rotación */
    Cuaternion.rota2(MatrizRotacion, q);

    /* MatrizRotacion = MatrizRotacion * Matriz */
    multiplica(MatrizRotacion, MatrizRotacion, Matriz);

};

function dibuja() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Matriz del Modelo */
    identidad(MatrizModelo);             // M = I
    escalacion(MatrizModelo, 3, 3, 3);
    multiplica(MatrizModelo, MatrizModelo, MatrizRotacion); // M = M * MatrizRotacion
    gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);

    tierra.dibuja(gl);

    let matrizPadre = MatrizModelo.slice(); // guardar matriz de la esfera

    // ---------- Hijos: arboles
    for (let i = 0; i < arboles.troncos.length; i++) {
        MatrizModelo = matrizPadre.slice(); // restaurar la matriz de la esfera
        let tree = arboles.troncos[i];
        let hoja = arboles.hojas[i];
        let data = arbolesData[i];
        let height = data.height;
        let radius = data.radius;
        let degX = data.degX;
        let degY = data.degY;
        let degZ = data.degZ;

        rotacionX(MatrizModelo, degX);
        rotacionY(MatrizModelo, degY);
        rotacionZ(MatrizModelo, degZ);
        traslacion(MatrizModelo, 0, 0, height/2);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        tree.dibuja(gl);
        traslacion(MatrizModelo, 0, 0, height/2);
        escalacion(MatrizModelo, data.copaX, data.copaY, data.copaZ);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        hoja.dibuja(gl);
    }

    for (let i = 0; i < nubes.length; i++) {
        MatrizModelo = matrizPadre.slice(); // restaurar la matriz de la esfera
        let cloud1 = nubes[i].cloud1;
        let cloud2 = nubes[i].cloud2;
        let cloud3 = nubes[i].cloud3;
        let data = nubesData[i];
        let x = data.x;
        let y = data.y;
        let z = data.z;
        let degX = data.degX;
        let degY = data.degY;
        let degZ = data.degZ;

        rotacionX(MatrizModelo, degX);
        rotacionY(MatrizModelo, degY);
        rotacionZ(MatrizModelo, degZ);
        traslacion(MatrizModelo, 0, 0, 1.9);
        escalacion(MatrizModelo, 1.1, 1.1, 1.1);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        cloud1.dibuja(gl);
        
                
        traslacion(MatrizModelo, 0.1, 0, 0);
        escalacion(MatrizModelo, 0.7, 0.7, 0.7);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        cloud2.dibuja(gl);
        
        traslacion(MatrizModelo, -0.25, 0, 0);
        escalacion(MatrizModelo, 0.9, 0.9, 0.9);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        cloud3.dibuja(gl);
    }

    for(let i = 0; i < flores.tallos.length; i++) {
        MatrizModelo = matrizPadre.slice(); // restaurar la matriz de la esfera
        let flower = flores.flowers[i];
        let tallo = flores.tallos[i];
        let data = floresData[i];
        let degX = data.degX;
        let degY = data.degY;
        let degZ = data.degZ;

        rotacionX(MatrizModelo, degX);
        rotacionY(MatrizModelo, degY);
        rotacionZ(MatrizModelo, degZ);
        traslacion(MatrizModelo, 0, 0, 1);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        tallo.dibuja(gl);

        traslacion(MatrizModelo, 0, 0, 0.05);
        escalacion(MatrizModelo, 1, 1, 2);
        gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
        flower.dibuja(gl);
    }
    // ---------- Primer hijo: cilindro
    // rotacionX(MatrizModelo, 90);
    // rotacionY(MatrizModelo, 10);
    // rotacionZ(MatrizModelo, 40);
    // traslacion(MatrizModelo, 0, 0, .75);
    // gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
    // cilindro.dibuja(gl);

    // // ---------- Segundo hijo: cilindro2
    // MatrizModelo = matrizPadre.slice(); // restaurar la matriz de la esfera

    // rotacionX(MatrizModelo, 20);
    // rotacionY(MatrizModelo, 60);
    // rotacionZ(MatrizModelo, 100);
    // traslacion(MatrizModelo, 0, 0, 0.55);
    // gl.uniformMatrix4fv(uMatrizModelo, false, MatrizModelo);
    // cilindro2.dibuja(gl);


    requestAnimationFrame(dibuja);
}


function reinicia() {
    /* Matriz de Rotación */
    identidad(MatrizRotacion);

    dibuja();
}

function main() {
    canvas = document.getElementById("webglcanvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.textContent("WebGL 2.0 no está disponible en tu navegador");
        return;
    }

    /* Para detectar los eventos del ratón */
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("mouseout", mouseUp, false);
    canvas.addEventListener("mousemove", mouseMove, false);

    /* Para los botones */
    document.getElementById("reset").onclick = reinicia;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    compilaEnlazaLosShaders();

    cubo = new Cubo(gl);
    tierra = new Esfera(gl, 1, 48, 48);
    // cilindro = new Cilindro(gl, 0.05, 1.5, 24, true, true);
    // cilindro2 = new Cilindro(gl, 0.02, 1.1, 24, true, true);

    arbolesData = getArbolesData(40);
    arboles = createTrees(arbolesData);

    nubesData = getArbolesData(10);
    nubes = createClouds(nubesData);

    floresData = getArbolesData(400);
    flores = createFlowers(floresData);

    arcBall = new ArcBall(500.0, 500.0);

    gl.useProgram(programaID);
    uMatrizProyeccion = gl.getUniformLocation(programaID, "uMatrizProyeccion");
    uMatrizVista = gl.getUniformLocation(programaID, "uMatrizVista");
    uMatrizModelo = gl.getUniformLocation(programaID, "uMatrizModelo");
    ortho(MatrizProyeccion, -5*2.36, 5*2.36, -5, 5, -5, 5);
    gl.uniformMatrix4fv(uMatrizProyeccion, false, MatrizProyeccion);
    identidad(MatrizVista);
    gl.uniformMatrix4fv(uMatrizVista, false, MatrizVista);
    identidad(MatrizRotacion);

    /* Ajusta el ancho a [-1..1] y el alto a [-1..1] */
    arcBall.ajusta(gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.6, 0.85, 0.95, 1.0);
    dibuja();
}

function createTrees(data) {
    let troncos = [];
    let hojas = [];
    for (let i = 0; i < data.length; i++) {
        let tronco = new Cilindro(gl, data[i].radius, data[i].height, 24, true, true);
        let hoja = new Esfera2(gl, 0.1, 24, 24);
        hojas.push(hoja);
        troncos.push(tronco);
    }

    return { troncos, hojas };
}

function createClouds(data) {
    let clouds = [];
    for (let i = 0; i < data.length; i++) {
        let cloud1 = new Esfera3(gl, 0.1, 24, 24);
        let cloud2 = new Esfera3(gl, 0.1, 24, 24);
        let cloud3 = new Esfera3(gl, 0.1, 24, 24);
        clouds.push({cloud1, cloud2, cloud3});
    }
    return clouds;
}

function createFlowers(data) {
    let flowers = [];
    let tallos = [];
    for (let i = 0; i < data.length; i++) {
        let tallo = new Cilindro2(gl, 0.005, 0.1, 24, true, true);
        let flower = new Esfera4(gl, 0.01, 24, 24);
        flowers.push(flower);
        tallos.push(tallo);
    }
    return { tallos, flowers };
}

window.onload = main;