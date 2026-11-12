---
layout: default
title: Research
hero: true
---

<div class="container">

{% assign research = site.research | sort:"order" %}

{% for item in research %}
    {% include research-card.html item=item %}
{% endfor %}

</div>