let pizarras = {};

function inicializarPizarra(pizarraId) {
  if (!pizarras[pizarraId]) {
    pizarras[pizarraId] = {
      objetos: [],
      version: 0
    };
  }
}

function initializeSockets(io) {
  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    socket.on("unirse", ({ pizarraId }) => {
      inicializarPizarra(pizarraId);
      socket.join(pizarraId);

      socket.emit("dibujo", {
        pizarraId,
        objetos: pizarras[pizarraId].objetos,
        version: pizarras[pizarraId].version
      });
    });

    socket.on("dibujo", ({ pizarraId, objeto, accion }) => {
      console.log("Id: ", pizarraId);
      console.log("objeto: ", objeto);
      console.log("accion: ", accion);
      inicializarPizarra(pizarraId);

      switch (accion) {
        case "agregar":
          pizarras[pizarraId].objetos.push(objeto);
          break;
        case "actualizar":
        case "mover":
          const idx = pizarras[pizarraId].objetos.findIndex(o => o.id === objeto.id);
          if (idx !== -1) pizarras[pizarraId].objetos[idx] = objeto;
          break;
        case "eliminar":
          pizarras[pizarraId].objetos = pizarras[pizarraId].objetos.filter(o => o.id !== objeto.id);
          break;
        default:
          console.log("Acción desconocida:", accion);
      }

      pizarras[pizarraId].version++;

      io.to(pizarraId).emit("dibujo", {
        pizarraId,
        objeto,
        accion,
        version: pizarras[pizarraId].version
      });
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado");
    });
  });
}

module.exports = { initializeSockets };
