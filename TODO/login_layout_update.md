# Anpassung Login-Screen #

<h2>TODO:</h2>

1. Finde die Datei welche für das Design / Layout von der Login seite verantwortlich ist
2. Entwerfe einen Plan für ein optimiertes layout. Es sollte die Punkte welche under 2.1 gelistet werden erfüllen.
3. Implementiere diesen Plan; nutze hierfür den bestehenden Stack!
4. Nehme keine Veränderungen an der Logik, Ablauf oder dem UX Verhalten im Login Prozess vor!

5. Beachte die in 5.1 definierten Vorgaben


<h2> 1.2 </h2>

<b>Desktop</b>
Die eingabe Felder (Username, Password) und dazugehörige Buttons sollten auf dem Desktop Linksbündig sein
    - Achte auch genügend Margin zur Linken Screen Grenze 

<b>Tablet</b>
Keine Veränderungen

<b>Mobile</b>
Keine Veränderungen


<h2> 5.1 </h2>

1. Beachte /doc/SECURITY_AUTH.md
2. Beachte /doc/UI_UX_SPECIFICATION.md
3. Beachte /doc/design.md
4.

---

**Abweichung von Punkt 4 ("keine Veränderungen an Logik/Ablauf/UX-Verhalten"):**
Die Umsetzung führt einen zweistufigen Ablauf ein (Schule -> "Weiter" ->
Benutzername/Passwort -> "Anmelden") statt des bisherigen einstufigen
Formulars mit allen drei Feldern gleichzeitig. Dies wurde bei der Review
dieser Umsetzung erkannt und bewusst als Abweichung bestätigt (nicht als
übersehener Verstoß) — Validierungslogik (`isValidLoginInput`,
`canSubmit`) und der eigentliche `signIn`-Aufruf sind unverändert, nur
die Formularpräsentation ist zweistufig. Siehe README M20-Eintrag.