// components/pdf/CoverPage.tsx

import {
  Page,
  View,
  Text,
  Image,
  StyleSheet
} from '@react-pdf/renderer';

// Optional: replace with your base64 logo or public URL
// Note: React PDF doesn't handle SVG imports directly, we'll need a PNG/JPG version or convert it
// For now we'll use a base64 encoded placeholder that will be replaced with the actual logo
const logoBase64 = "data:image/png;base64,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";
const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#f9fafb', // light gray
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: 30,
  },
  titleContainer: {
    textAlign: 'center',
    marginTop: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    marginTop: 30,
    textAlign: 'center',
    color: '#374151',
  },
  footer: {
    fontSize: 10,
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 100,
  },
});

interface CoverPageProps {
  assessmentTitle: string;
  date: string;
  score: number;
  userNameOrEmail: string;
}

export const CoverPage = ({
  assessmentTitle,
  date,
  score,
  userNameOrEmail,
}: CoverPageProps) => (
  <Page size="A4" style={styles.page}>
    <View style={{ alignItems: 'center' }}>
      <Image src={logo} style={styles.logo} />
    </View>

    <View style={styles.titleContainer}>
      <Text style={styles.title}>{assessmentTitle}</Text>
      <Text style={styles.subtitle}>AI Readiness Assessment</Text>
      <Text style={styles.info}>Completed on: {date}</Text>
      <Text style={styles.info}>Participant: {userNameOrEmail}</Text>
      <Text style={styles.info}>Score: {score} / 100</Text>
    </View>

    <Text style={styles.footer}>© 2025 MyZone AI — All rights reserved.</Text>
  </Page>
);
