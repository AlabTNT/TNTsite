// content/book.typ

#let book(title: "Notebook", body) = {
  set document(title: title)
  // For web rendering, we use a fixed comfortable reading width
  // and auto height so the whole document renders as one continuous scrollable page.
  set page(
    width: 800pt,
    height: auto,
    margin: (x: 40pt, y: 40pt),
    fill: rgb("#ffffff") // Will be transparent or white, the SVG can be embedded
  )

  // Typography settings to match a classic book
  set text(
    font: ("Linux Libertine", "Noto Serif CJK SC", "SimSun", "Times New Roman"),
    size: 16pt,
    lang: "zh",
    region: "cn"
  )

  // Paragraph formatting: justified, with first-line indent
  set par(
    justify: true,
    first-line-indent: 2em,
    leading: 1.0em
  )

  // Headings
  show heading: it => {
    // Reset par indent for headings
    set par(first-line-indent: 0em)
    set text(weight: "bold")
    v(1.5em)
    it
    v(0.5em)
  }
  
  // Custom links
  show link: set text(fill: rgb(0, 80, 160))

  // Blockquotes
  show quote.where(block: true): it => pad(
    left: 1em,
    box(
      stroke: (left: 2pt + rgb(0, 80, 160)),
      inset: (left: 1em),
      it
    )
  )

  // The main title
  align(center)[
    #set par(first-line-indent: 0em)
    #text(size: 24pt, weight: "bold", title)
    #v(2em)
  ]

  // Body content
  body
}
