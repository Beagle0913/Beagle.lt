/* Lesson data for the English trainer: "Clone a gene" (Allison, Fundamental Molecular Biology, Ch 8).
   No DOM here. Lesson content stays English in both interface languages. */
(function (ENG) {
  'use strict';
  const c = (text, answer, distractors) => ({ type: 'choice', text, answer, distractors });

  ENG.lesson = {
    id: 'ch8-cloning',
    title: 'Clone a gene',
    chapter: 'Ch 8 · 8.3, 8.4, 8.7',
    sections: { '8.3': 'Cutting and joining DNA', '8.4': 'Molecular cloning', '8.7': 'DNA sequencing' },
    scenes: [
      {
        id: 'cut', title: { lt: 'Kirpimas', en: 'Cut' },
        steps: [
          c("We need an enzyme that recognises a short DNA sequence and cuts it there: a ___.", "restriction endonuclease", ["DNA ligase", "phosphatase", "DNA polymerase"]),
          c("The short sequence it recognises, GAATTC, is called its ___.", "restriction site", ["primer", "insert", "multiple cloning site"]),
          c("GAATTC reads the same 5'→3' on both strands, so it is a ___.", "palindrome", ["plasmid", "primer", "clone"]),
          c("EcoRI cuts between G and A on each strand, leaving short single-stranded tails: ___.", "sticky ends", ["blunt ends", "primers", "inserts"])
        ]
      },
      {
        id: 'carrier', title: { lt: 'Nešiklis', en: 'Choose a carrier' },
        steps: [
          c("To copy our gene we need a carrier DNA molecule that replicates on its own inside the host cell: a ___.", "vector", ["insert", "primer", "colony"]),
          c("Our vector, pUC18, is a small circular DNA molecule outside the bacterial chromosome: a ___.", "plasmid", ["clone", "palindrome", "electropherogram"]),
          c("pUC18 has a region with many unique restriction sites where the gene can go: the ___.", "multiple cloning site", ["restriction site", "selectable marker", "primer"]),
          c("The foreign DNA we put into the vector is called the ___.", "insert", ["vector", "primer", "clone"])
        ]
      },
      {
        id: 'join', title: { lt: 'Jungimas', en: 'Join' },
        steps: [
          c("The cut vector could simply close on itself. To prevent this, we remove its 5'-phosphates with ___.", "phosphatase", ["DNA ligase", "restriction endonuclease", "X-gal"]),
          c("The matching sticky ends of vector and insert pair up by hydrogen bonds. This is called ___.", "annealing", ["ligation", "transformation", "electroporation"]),
          c("Gaps remain in the sugar-phosphate backbone. The enzyme that seals them with phosphodiester bonds is ___.", "DNA ligase", ["restriction endonuclease", "phosphatase", "DNA polymerase"]),
          c("A molecule made by joining DNA from two different sources is ___.", "recombinant DNA", ["plasmid DNA", "primer", "clone"])
        ]
      },
      {
        id: 'bacteria', title: { lt: 'Į bakterijas', en: 'Into bacteria' },
        steps: [
          c("E. coli cells treated with a calcium salt solution have leaky membranes and can take up DNA. They are ___.", "competent cells", ["clones", "colonies", "vectors"]),
          c("Introducing the plasmid into the bacterial cells is called ___.", "transformation", ["ligation", "annealing", "blue-white screening"]),
          c("Instead of calcium, a strong electric current can drive DNA into cells. This is ___.", "electroporation", ["capillary electrophoresis", "annealing", "ligation"])
        ]
      },
      {
        id: 'plate', title: { lt: 'Auginimas ir atranka', en: 'Grow and pick' },
        steps: [
          c("The agar contains ampicillin. Only cells carrying pUC18 survive, because its ampicillin resistance gene is a ___.", "selectable marker", ["multiple cloning site", "restriction site", "primer"]),
          c("A single cell divides again and again into a visible spot on the agar: a ___.", "colony", ["plasmid", "insert", "vector"]),
          c("All the cells in it come from one parent cell, so they form a ___.", "clone", ["vector", "insert", "palindrome"]),
          c("The agar also contains a colourless compound that turns blue when β-galactosidase cleaves it: ___.", "X-gal", ["ampicillin", "phosphatase", "ddNTPs"]),
          { type: 'tap', text: "Tap a colony that carries our gene.", term: "blue-white screening", right: "White: the insert is in lacZ, so no blue.", wrong: "Blue: lacZ is intact, so there is no insert." }
        ]
      },
      {
        id: 'sequence', title: { lt: 'Sekos skaitymas', en: 'Read the sequence' },
        steps: [
          c("Sanger sequencing starts from a short piece of DNA that provides the 3'-OH for DNA polymerase: a ___.", "primer", ["insert", "ddNTP", "plasmid"]),
          c("The reaction also contains nucleotides that lack the 3'-OH, so the chain stops when one is added: ___.", "ddNTPs", ["dNTPs", "primers", "phosphatase"]),
          c("In automated sequencers, the fragments are separated by size in arrays of thin tubes: ___.", "capillary electrophoresis", ["electroporation", "transformation", "annealing"]),
          c("A laser makes each fluorescent label glow. The computer plot of fluorescence peaks is an ___.", "electropherogram", ["colony", "palindrome", "restriction site"]),
          c("Newer machines sequence a huge number of DNA fragments at the same time: ___.", "next-generation sequencing", ["capillary electrophoresis", "blue-white screening", "transformation"])
        ]
      }
    ],
    glossary: [
      // 8.3 Cutting and joining DNA
      { term: "restriction endonuclease", section: "8.3", forms: [], def: "an enzyme that recognises a specific short DNA sequence and cuts both strands of the DNA there." },
      { term: "restriction site", section: "8.3", forms: [], def: "the short DNA sequence that a restriction endonuclease recognises and cuts." },
      { term: "palindrome", section: "8.3", forms: [], def: "a sequence that reads the same 5'→3' on both strands, e.g. GAATTC." },
      { term: "sticky ends", section: "8.3", forms: [], def: "also called cohesive ends; short single-stranded tails left by a staggered cut, which can base-pair with matching tails." },
      { term: "blunt ends", section: "8.3", forms: [], def: "ends with no unpaired nucleotides, made when both strands are cut at the same position (e.g. by SmaI)." },
      { term: "DNA ligase", section: "8.3", forms: [], def: "an enzyme that joins pieces of DNA by forming phosphodiester bonds; it needs ATP." },
      { term: "ligation", section: "8.3", forms: [], def: "joining linear DNA fragments together with covalent bonds." },
      { term: "annealing", section: "8.3", forms: [], def: "the pairing of complementary single-stranded DNA by hydrogen bonds, e.g. of matching sticky ends." },
      { term: "recombinant DNA", section: "8.3", forms: [], def: "a DNA molecule made by joining DNA from different sources." },
      // 8.4 Molecular cloning
      { term: "vector", section: "8.4", forms: ["vectors"], def: "a carrier DNA molecule that replicates independently in a host cell and carries the foreign DNA." },
      { term: "plasmid", section: "8.4", forms: [], def: "a circular, double-stranded DNA molecule outside the chromosome that replicates on its own in bacteria." },
      { term: "plasmid DNA", section: "8.4", forms: [], def: "DNA of a plasmid alone, without anything joined into it." },
      { term: "insert", section: "8.4", forms: ["inserts"], def: "the foreign DNA fragment joined into a vector." },
      { term: "multiple cloning site", section: "8.4", forms: [], def: "a region of a vector with several unique restriction sites, each present only once." },
      { term: "phosphatase", section: "8.4", forms: [], def: "an enzyme that removes the terminal 5'-phosphate, so a cut vector cannot be re-joined to itself by ligase." },
      { term: "transformation", section: "8.4", forms: [], def: "introducing DNA into bacterial cells." },
      { term: "competent cells", section: "8.4", forms: [], def: "cells made permeable (e.g. with a calcium salt solution) so they can take up DNA." },
      { term: "electroporation", section: "8.4", forms: [], def: "driving DNA into cells with a strong electric current." },
      { term: "selectable marker", section: "8.4", forms: [], def: "a gene, usually for antibiotic resistance, that lets only cells carrying the vector grow." },
      { term: "ampicillin", section: "8.4", forms: [], def: "an antibiotic that blocks bacterial cell wall synthesis and kills dividing cells that lack the resistance gene." },
      { term: "colony", section: "8.4", forms: ["colonies"], def: "a visible group of millions of identical cells grown from one cell on an agar plate." },
      { term: "clone", section: "8.4", forms: ["clones"], def: "a population of identical cells (or DNA copies) descended from a single parent cell." },
      { term: "X-gal", section: "8.4", forms: [], def: "a colourless compound that β-galactosidase cleaves into a blue product." },
      { term: "blue-white screening", section: "8.4", forms: [], def: "telling recombinant from non-recombinant colonies on X-gal: an insert in lacZ leaves the colony white, an intact lacZ makes it blue." },
      // 8.7 DNA sequencing
      { term: "primer", section: "8.7", forms: ["primers"], def: "a short single-stranded piece of DNA that provides the 3'-OH where DNA polymerase starts synthesis." },
      { term: "DNA polymerase", section: "8.7", forms: [], def: "the enzyme that synthesises a new DNA strand from nucleotides." },
      { term: "dNTPs", section: "8.7", forms: [], def: "normal deoxynucleotides (dATP, dCTP, dGTP, dTTP), the building blocks of DNA; they have a 3'-OH." },
      { term: "ddNTPs", section: "8.7", forms: ["ddNTP"], def: "dideoxynucleotides; they lack the 3'-OH, so the chain stops when one is added (chain terminators)." },
      { term: "capillary electrophoresis", section: "8.7", forms: [], def: "separating DNA fragments by size in thin capillary tubes, as in automated sequencers." },
      { term: "electropherogram", section: "8.7", forms: [], def: "the computer plot of fluorescence intensity over time, read as the DNA sequence." },
      { term: "next-generation sequencing", section: "8.7", forms: [], def: "newer methods that sequence a huge number of DNA fragments in parallel." }
    ]
  };
})(globalThis.ENG = globalThis.ENG || {});
