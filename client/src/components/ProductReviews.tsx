import { useEffect, useState } from 'react';
import { Rate, Input, Button, message, Avatar, Divider, Empty } from 'antd';
import axios from 'axios';
import customerAxios from '../api/customerAxios';

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  customerName: string;
  created_at: string;
}

interface ReviewsData {
  reviews: ReviewItem[];
  averageRating: number;
  count: number;
}

interface Eligibility {
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  canReview: boolean;
}

interface Props {
  productId: number;
  isLoggedIn: boolean;
}

export default function ProductReviews({ productId, isLoggedIn }: Props) {
  const [data, setData] = useState<ReviewsData>({ reviews: [], averageRating: 0, count: 0 });
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/reviews/product/${productId}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ reviews: [], averageRating: 0, count: 0 }))
      .finally(() => setLoading(false));
  };

  const loadEligibility = () => {
    if (!isLoggedIn) {
      setEligibility(null);
      return;
    }
    customerAxios
      .get(`/reviews/product/${productId}/eligibility`)
      .then((res) => setEligibility(res.data))
      .catch(() => setEligibility(null));
  };

  useEffect(() => {
    setLoading(true);
    loadReviews();
    loadEligibility();
    setRating(0);
    setComment('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isLoggedIn]);

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await customerAxios.post(`/reviews/${productId}`, { rating, comment: comment || undefined });
      message.success('Review submitted');
      setRating(0);
      setComment('');
      loadReviews();
      loadEligibility();
    } catch {
      message.error('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Reviews</h3>
        {data.count > 0 && (
          <>
            <Rate disabled allowHalf value={data.averageRating} style={{ fontSize: 14 }} />
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {data.averageRating} ({data.count} review{data.count !== 1 ? 's' : ''})
            </span>
          </>
        )}
      </div>

      {isLoggedIn && eligibility?.canReview && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Write a review
          </span>
          <Rate value={rating} onChange={setRating} style={{ marginBottom: 8 }} />
          <Input.TextArea
            rows={2}
            placeholder="Share your thoughts about this product (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Button type="primary" size="small" loading={submitting} onClick={handleSubmit}>
            Submit Review
          </Button>
        </div>
      )}

      {isLoggedIn && eligibility && !eligibility.hasPurchased && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          You can review this product after your order is delivered.
        </p>
      )}

      {isLoggedIn && eligibility?.alreadyReviewed && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          You've already reviewed this product.
        </p>
      )}

      {!loading && data.reviews.length === 0 && (
        <Empty description="No reviews yet" style={{ margin: '16px 0' }} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto' }}>
        {data.reviews.map((r) => (
          <div key={r.id} style={{ display: 'flex', gap: 10 }}>
            <Avatar size={32} style={{ backgroundColor: '#4f46e5', flexShrink: 0 }}>
              {r.customerName?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.customerName}</span>
                <Rate disabled value={r.rating} style={{ fontSize: 11 }} />
              </div>
              {r.comment && (
                <p style={{ fontSize: 13, color: '#374151', margin: '4px 0 0' }}>{r.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}