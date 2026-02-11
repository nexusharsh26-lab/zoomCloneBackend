import { Server } from "socket.io";

let connections: Record<string, string[]> = {};
let messages: Record<string, any[]> = {};
let timeOnline: Record<string, Date> = {};

export const connectToSocket = (server: any) => {
  console.log("something connected");
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ---------------- JOIN CALL ----------------
    socket.on("join-call", (path: string) => {
      // path example: localhost/43453

      if (connections[path] === undefined) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify all users in the room
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          connections[path],
        );
      }

      // Send chat history to newly joined user
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; a++) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a].data,
            messages[path][a].sender,
            messages[path][a]["socket-id-sender"],
          );
        }
      }
    });

    // ---------------- SIGNAL (WebRTC) ----------------
    socket.on("signal", (toId: string, message: any) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // ---------------- CHAT MESSAGE ----------------
    socket.on("chat-message", (data: any, sender: string) => {
      // Find the room this socket belongs to
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false] as [string, boolean],
      );

      if (found) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        console.log("message:", matchingRoom, ":", sender, data);

        // Emit message to all users in the room
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // ---------------- DISCONNECT ----------------
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      var diffTime = Math.abs(timeOnline[socket.id] - new Date());

      var key;

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections)),
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;
            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            var index = connections[key].indexOf(socket.id);

            connections[key].splice(index, 1);

            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });

  return io;
};
