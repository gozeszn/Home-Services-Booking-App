import React from "react";
import { Link } from "react-router-dom";

export default function FeaturePlaceholderPage({
  title,
  description,
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Coming soon</p>
      <h1>{title}</h1>
      <p className="intro">{description}</p>

      <p>
        This page is being prepared and is not available yet.
      </p>

      <Link className="button" to="/">
        Back to home
      </Link>
    </section>
  );
}