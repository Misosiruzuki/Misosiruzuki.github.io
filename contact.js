"use strict";

const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = contactForm.dataset.email || "galaxytabasmt816@gmail.com";
    const formData = new FormData(contactForm);
    const kind = formData.get("kind") || "お問い合わせ";
    const name = formData.get("name") || "未入力";
    const reply = formData.get("reply") || "未入力";
    const message = formData.get("message") || "";
    const subject = `[Somi Games] ${kind}`;
    const body = [
      `お問い合わせ種別: ${kind}`,
      `お名前: ${name}`,
      `返信先: ${reply}`,
      "",
      "内容:",
      message
    ].join("\n");

    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    if (contactStatus) {
      contactStatus.textContent = "メール作成画面を開きました。開かない場合は、表示されているメールアドレス宛に直接ご連絡ください。";
    }
  });
}
