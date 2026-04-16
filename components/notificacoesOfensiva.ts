import * as Notifications from "expo-notifications";

/**
 * Solicita permissão e agenda uma notificação local para o final do dia
 * caso o usuário não tenha feito depósito.
 * Chame isso ao abrir o app se `depositoHoje === false`.
 */
export async function agendarNotificacaoOfensiva() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  // Cancela qualquer notificação anterior pendente
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Dispara às 21h do dia atual
  const agora = new Date();
  const gatilho = new Date();
  gatilho.setHours(21, 0, 0, 0);

  // Se já passou das 21h, não agenda para hoje
  if (agora >= gatilho) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Sua ofensiva está em risco!",
      body: "Faça um depósito hoje para não perder sua sequência.",
      sound: true,
    },
    trigger: gatilho,
  });
}

/**
 * Dispara imediatamente uma notificação informando que a ofensiva foi perdida.
 */
export async function notificarOfensivaQuebrada(diasPerdidos: number) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💔 Ofensiva perdida!",
      body: `Você perdeu sua sequência de ${diasPerdidos} ${diasPerdidos === 1 ? "dia" : "dias"}. Recomece hoje!`,
      sound: true,
    },
    trigger: null, // imediata
  });
}
