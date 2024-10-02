import { VerticalFeatureRow } from './VerticalFeatureRow';
import { Section } from './Section';

const VerticalFeatures = () => (
  <Section
    title="Features"
    description="Our App is rich in features to satisfy your business management."
  >
    <VerticalFeatureRow
      title="Point of Sale (POS)"
      description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse bibendum, nunc non posuere consectetur, justo erat semper enim, non hendrerit dui odio id enim."
      image="/assets/images/feature.svg"
      imageAlt="Settlo POS"
    />
    <VerticalFeatureRow
      title="Business Insights"
      description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse bibendum, nunc non posuere consectetur, justo erat semper enim, non hendrerit dui odio id enim."
      image="/assets/images/feature2.svg"
      imageAlt="Settlo Reports"
      reverse
    />
    <VerticalFeatureRow
      title="Live Orders & KDS"
      description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse bibendum, nunc non posuere consectetur, justo erat semper enim, non hendrerit dui odio id enim."
      image="/assets/images/feature3.svg"
      imageAlt="Settlo KDS"
    />
  </Section>
);

export { VerticalFeatures };
