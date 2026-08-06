export const calculateAge = (dob) => {
  const birthDate = new Date(dob);

  if (isNaN(birthDate.getTime())) return "—";

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return `${age} Years`;
};

export const formatDate = (date) => {
  const d = new Date(date);

  if (isNaN(d.getTime())) return "—";

  const day = d.getUTCDate();
  const s = day > 3 && day < 21 ? "th" : ["th", "st", "nd", "rd"][Math.min(day % 10, 3)];
  return `${`${day}`.padStart(2, "0")}${s} ${new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(d)} ${d.getUTCFullYear()}`;
};

export const formatDateTime = (date) =>
  `${formatDate(date)}, ${new Date(date).toLocaleString("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;