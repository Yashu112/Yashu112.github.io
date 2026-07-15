---
layout: default
title: Tree Coloring Explorer

hero : true
hero_title: Tree Coloring Explorer

game : true
---

A majority coloring of a graph assigns colors to vertices so that each vertex has at most half of its neighbors in the same color class.
This tool lets you experiment with majority colorings on trees. Click any vertex to cycle through the available colors. The goal is to find a valid majority coloring &mdash; one where for every vertex $v$, at most $\lfloor \deg(v)/2 \rfloor$ neighbors share $v$'s color &mdash; using as few colors as possible.

Select a tree type from the first dropdown and the number of colors from the second.
Use <em>Regenerate</em> to draw a fresh random tree, or choose <em>Your Tree</em>
to build a custom tree: click a node to select it, then use <em>Add child</em>
and <em>Delete</em> to modify the tree, and <em>Done</em> when finished.

Built with [Dr. Brahadeesh](brahadeesh1994.github.io) as a part of work on the majority coloring game on trees; see the
[research description](https://brahadeesh1994.github.io/research.html#majority-coloring-game) for context.

{% include game.html %}
