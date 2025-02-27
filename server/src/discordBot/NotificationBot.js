import axios from "axios";
export const sendNotification = async (type, data) => {
  let message = "";
  if (type === "login") {
    message = `User ${data.name} logged in`;
    await axios.post(process.env.DISCORD_BOT_WEBHOOK, {
      content: `${message}`,
    });
  }
  if (type === "register") {
    message = `User ${data.name} logged out`;
  }
  console.log(message);
};
