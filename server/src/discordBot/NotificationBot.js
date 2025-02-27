import axios from "axios";
export const sendNotification = async (type, data) => {
  let message = "";
  if (!process.env.DISCORD_BOT_WEBHOOK) return;
  if (!type) {
    console.error("No type provided for notification");
    return;
  }
  if (type === "login") {
    message = `User ${
      data.name
    } logged in at ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`;
  }
  if (type === "register") {
    message = `User ${
      data.name
    } registered at ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`;
  }
  if (type === "support") {
    message = `${data.name} with email ${data.email} on topic ${data.topic} \nsent a message: ${data.message}`;
  }
  if (!message) {
    console.error(`Type ${type} not supported. Please check the type`);
    return;
  }
  await axios.post(process.env.DISCORD_BOT_WEBHOOK, {
    content: `${message}`,
  });
};
