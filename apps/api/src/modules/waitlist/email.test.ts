import { expect, test } from "vitest";
import { waitlistEmail } from "./email";

test("renders the real position and absolute links", () => {
  const { subject, html } = waitlistEmail({
    position: 7,
    siteUrl: "https://userelay.site",
  });
  expect(subject).toBe("Você está na lista.");
  expect(html).toContain("nº 7");
  expect(html).toContain(
    'href="https://userelay.site/privacidade?utm_source=email',
  );
  expect(html).toContain(
    '/?utm_source=email&utm_medium=transactional&utm_campaign=waitlist_confirmation#como"',
  );
  expect(html).toContain('src="https://userelay.site/email-mascot.png"');
  expect(html).not.toContain("undefined");
});
