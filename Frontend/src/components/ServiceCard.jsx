import React from "react";
import { Link } from "react-router-dom";

import { formatPrice } from "../utils/formatPrice";

export default function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <p className="service-location">{service.location}</p>

      <h2>
        <Link to={`/services/${service.id}`}>
          {service.title}
        </Link>
      </h2>

      <p className="service-provider">
        By {service.provider.displayName}
      </p>

      <p className="service-description">
        {service.description}
      </p>

      <div className="service-card-footer">
        <p className="service-price">
          <strong>
            {formatPrice(service.price, service.currency)}
          </strong>
          <span> / {service.pricingUnit}</span>
        </p>

        <Link
          className="button"
          to={`/services/${service.id}`}
          aria-label={`View ${service.title}`}
        >
          View details
        </Link>
      </div>
    </article>
  );
}