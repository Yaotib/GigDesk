# Button

Buttons start with a verb and use sentence case. Use **Primary** (lime fill, ink text) at most once per view, for the single thing the page is for: "Analyse brief", "Approve quote", "Export PDF". Default is white with a `line-control` border. Ghost is for Cancel and inline table actions. Destructive actions use ghost with `danger` text and always need a confirmation dialog.

Heights are 36px (`control-md`) on desktop and 44px (`control-lg`) on mobile. Disabled buttons stay visible and explain themselves: a disabled Export always sits next to the approval lock message. The consumer provides a Lucide icon (16px, stroke 1.75) and the label.
