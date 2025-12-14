import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

// Convert statsData to styled HTML for PDF export for a specific time frame
function convertToPDF({ timeFrame, macroSummary, carbs, fats, minerals, vitamins, foodLogs }) {
  // Helper to round numbers to 2 decimals, but keep 0 as 0
  const safe = (val) => {
    if (val === undefined || val === null) return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
  };

  // Inline SVG icons for PDF (use base64 PNG fallback for best compatibility)
  const icons = {
    calories: `<img src="https://img.icons8.com/fluency/48/fire-element.png" width="22" height="22" style="vertical-align:middle;margin-bottom:2px;" />`,
    carbs: `<img src="https://img.icons8.com/fluency/48/noodles.png" width="22" height="22" style="vertical-align:middle;margin-bottom:2px;" />`,
    protein: `<img src="https://img.icons8.com/fluency/48/steak.png" width="22" height="22" style="vertical-align:middle;margin-bottom:2px;" />`,
    fat: `<img src="https://img.icons8.com/fluency/48/peanuts.png" width="22" height="22" style="vertical-align:middle;margin-bottom:2px;" />`
  };

  // Professional-grade macro card with icons and spacing
  const macroCard = `
    <div style="margin-bottom:36px;">
      <div style="font-size:15px;color:#64748b;font-weight:700;margin-bottom:10px;letter-spacing:0.5px;">Macronutrient Overview</div>
      <div style="background:#fff;border-radius:20px;box-shadow:0 2px 12px #e0e7ef;padding:28px 32px 18px 32px;border:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;margin-bottom:20px;">
          <img src="https://img.icons8.com/fluency/48/apple.png" width="22" height="22" style="vertical-align:middle;margin-bottom:2px;" />
          <span style="font-weight:700;font-size:18px;color:#111827;margin-left:12px;letter-spacing:0.2px;">Macronutrients</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0;">
          <div style="flex:1;text-align:center;">
            ${icons.calories}
            <div style="font-size:13px;color:#64748b;margin-top:8px;">Calories</div>
            <div style="font-weight:900;color:#2563eb;font-size:26px;margin-top:4px;">${safe(macroSummary.calories)}</div>
            <div style="font-size:12px;color:#b6c2d1;">kcal</div>
          </div>
          <div style="width:1px;height:56px;background:#e5e7eb;margin:0 8px;"></div>
          <div style="flex:1;text-align:center;">
            ${icons.carbs}
            <div style="font-size:13px;color:#64748b;margin-top:8px;">Carbs</div>
            <div style="font-weight:900;color:#22c55e;font-size:26px;margin-top:4px;">${safe(macroSummary.carbs)}</div>
            <div style="font-size:12px;color:#b6c2d1;">g</div>
          </div>
          <div style="width:1px;height:56px;background:#e5e7eb;margin:0 8px;"></div>
          <div style="flex:1;text-align:center;">
            ${icons.protein}
            <div style="font-size:13px;color:#64748b;margin-top:8px;">Protein</div>
            <div style="font-weight:900;color:#a21caf;font-size:26px;margin-top:4px;">${safe(macroSummary.protein)}</div>
            <div style="font-size:12px;color:#b6c2d1;">g</div>
          </div>
          <div style="width:1px;height:56px;background:#e5e7eb;margin:0 8px;"></div>
          <div style="flex:1;text-align:center;">
            ${icons.fat}
            <div style="font-size:13px;color:#64748b;margin-top:8px;">Fat</div>
            <div style="font-weight:900;color:#f59e42;font-size:26px;margin-top:4px;">${safe(macroSummary.fat)}</div>
            <div style="font-size:12px;color:#b6c2d1;">g</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Professional-grade nutrient card
  const nutrientCard = (title, color, items, iconUrl) => `
    <div style="background:#fff;border-radius:20px;box-shadow:0 1px 8px #e0e7ef;padding:22px 32px 14px 32px;border:1px solid #e5e7eb;margin-bottom:26px;">
      <div style="display:flex;align-items:center;margin-bottom:14px;">
        <img src="${iconUrl}" width="22" height="22" style="vertical-align:middle;margin-bottom:2px;" />
        <span style="font-weight:700;font-size:16px;color:#111827;margin-left:12px;letter-spacing:0.2px;">${title}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;">
        ${items.map(i => `
          <div style="width:48%;display:inline-block;margin-bottom:12px;">
            <span style="font-size:14px;color:#64748b;">${i.label}:</span>
            <span style="font-weight:700;color:${i.color};margin-left:10px;font-size:14px;">${safe(i.value)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Professional-grade food log table
  const foodLogTable = (logs) => `
    <div style="margin-top:32px;">
      <h3 style="color:#f59e42;font-size:19px;margin-bottom:16px;font-weight:700;letter-spacing:0.2px;">Food Log</h3>
      ${logs.length === 0 ? `<div style="color:#b6c2d1;font-size:15px;">No food logged for this time frame.</div>` : logs.map(log => `
        <div style="margin-bottom:28px;">
          <div style="font-weight:700;color:#6366f1;font-size:16px;margin-bottom:8px;letter-spacing:0.2px;">${log.date}</div>
          ${log.foods && log.foods.length > 0 ? log.foods.map(food => {
            const details = food.details || {};
            const s = food.serving || {};
            return `
              <div style="margin-bottom:12px;padding:18px 20px;background:#f3f4f6;border-radius:14px;border:1px solid #e5e7eb;">
                <div style="font-weight:700;font-size:15px;color:#374151;margin-bottom:6px;letter-spacing:0.1px;">${details.food_name || food.foodId}</div>
                <div style="display:flex;flex-wrap:wrap;">
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Serving:</b> ${s.serving_description || 0}
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Amount:</b> ${s.metric_serving_amount || 0} ${s.metric_serving_unit || ''}
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Calories:</b> ${s.calories || 0}
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Carbs:</b> ${s.carbohydrate || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Protein:</b> ${s.protein || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Fat:</b> ${s.fat || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Sat. Fat:</b> ${s.saturated_fat || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Polyunsat. Fat:</b> ${s.polyunsaturated_fat || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Monounsat. Fat:</b> ${s.monounsaturated_fat || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Cholesterol:</b> ${s.cholesterol || 0}mg
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Sodium:</b> ${s.sodium || 0}mg
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Potassium:</b> ${s.potassium || 0}mg
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Fiber:</b> ${s.fiber || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Sugar:</b> ${s.sugar || 0}g
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Vit. A:</b> ${s.vitamin_a || 0}
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Vit. C:</b> ${s.vitamin_c || 0}mg
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Calcium:</b> ${s.calcium || 0}mg
                  </div>
                  <div style="width:48%;display:inline-block;font-size:14px;color:#444;margin-bottom:4px;">
                    <b>Iron:</b> ${s.iron || 0}mg
                  </div>
                </div>
              </div>
            `;
          }).join('') : `<div style="font-size:14px;color:#bbb;">No foods logged.</div>`}
        </div>
      `).join('')}
    </div>
  `;

  return `
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Nutrix Export</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 36px; color: #222; background: #f8fafc; }
        h2 { margin-top: 28px; margin-bottom: 22px; font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: 0.6px;}
        table { margin-bottom: 18px; }
      </style>
    </head>
    <body>
      <h2>${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Nutrition Export</h2>
      ${macroCard}
      ${nutrientCard('Carbohydrates', '#22c55e', carbs, 'https://img.icons8.com/fluency/48/barley.png')}
      ${nutrientCard('Fats', '#f59e42', fats, 'https://img.icons8.com/fluency/48/water.png')}
      ${nutrientCard('Minerals', '#6366f1', minerals, 'https://img.icons8.com/fluency/48/diamond.png')}
      ${nutrientCard('Vitamins', '#059669', vitamins, 'https://img.icons8.com/fluency/48/leaf.png')}
      ${foodLogTable(foodLogs)}
    </body>
    </html>
  `;
}

// Convert food log and macro/micro data to CSV string for export
function convertToCSV({ allTimeFrameLog, foodDetailsMap }) {
  // Ensure allTimeFrameLog is always an array
  const logs = Array.isArray(allTimeFrameLog) ? allTimeFrameLog : [];
  const headers = [
    'Date', 'Food Name', 'Serving Description', 'Amount', 'Unit',
    'Calories', 'Carbs', 'Protein', 'Fat', 'Sat. Fat', 'Polyunsat. Fat', 'Monounsat. Fat',
    'Cholesterol', 'Sodium', 'Potassium', 'Fiber', 'Sugar', 'Vit. A', 'Vit. C', 'Calcium', 'Iron'
  ];
  const rows = [headers];

  logs.forEach(log => {
    (log.foods || []).forEach(food => {
      const details = food.foodId ? foodDetailsMap[food.foodId] : {};
      let firstServing = null;
      if (details && details.servings && details.servings.serving) {
        const servingsArr = Array.isArray(details.servings.serving)
          ? details.servings.serving
          : [details.servings.serving];
        firstServing = servingsArr[0];
      }
      rows.push([
        log.date,
        details?.food_name || food.foodId || '',
        firstServing?.serving_description || '',
        firstServing?.metric_serving_amount || '',
        firstServing?.metric_serving_unit || '',
        firstServing?.calories || '',
        firstServing?.carbohydrate || '',
        firstServing?.protein || '',
        firstServing?.fat || '',
        firstServing?.saturated_fat || '',
        firstServing?.polyunsaturated_fat || '',
        firstServing?.monounsaturated_fat || '',
        firstServing?.cholesterol || '',
        firstServing?.sodium || '',
        firstServing?.potassium || '',
        firstServing?.fiber || '',
        firstServing?.sugar || '',
        firstServing?.vitamin_a || '',
        firstServing?.vitamin_c || '',
        firstServing?.calcium || '',
        firstServing?.iron || ''
      ]);
    });
  });

  return rows.map(row =>
    row.map(val =>
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  ).join('\n');
}

// Convert to Excel (CSV for now)
function convertToExcel({ allTimeFrameLog, foodDetailsMap }) {
  return convertToCSV({ allTimeFrameLog, foodDetailsMap });
}

const ExportData = () => {
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const { isDarkMode } = useTheme(); // <-- use theme context
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
const [selectedTimeFrame, setSelectedTimeFrame] = useState('today');
const [exporting, setExporting] = useState(false);

  // Add expand/collapse state for each day's log
  const [expandedDays, setExpandedDays] = useState({});

  // Toggle expand/collapse for a given day index
  const toggleExpandDay = (idx) => {
    setExpandedDays(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Helper to get date range for any time frame
  const getRangeForTimeFrame = (timeFrame, selectedDate) => {
    const end = formatDate(selectedDate);
    const startDate = new Date(selectedDate);
    let days = 1;
    switch (timeFrame) {
      case 'today':
        days = 1;
        break;
      case 'weekly':
        days = 7;
        break;
      case 'monthly':
        days = 30;
        break;
      case '3months':
        days = 90;
        break;
      case '6months':
        days = 180;
        break;
      case '9months':
        days = 270;
        break;
      case 'year':
        days = 365;
        break;
      default:
        days = 1;
    }
    startDate.setDate(startDate.getDate() - (days - 1));
    const start = formatDate(startDate);
    return { start, end };
  };

  // Unified food log state for all time frames
  const [allTimeFrameLog, setAllTimeFrameLog] = useState([]);
  const [allTimeFrameLogLoading, setAllTimeFrameLogLoading] = useState(false);
  const [allTimeFrameLogError, setAllTimeFrameLogError] = useState(null);

  // Fetch food logs for any time frame
  useEffect(() => {
    if (!user?._id || !selectedTimeFrame) return;
    const fetchLog = async () => {
      setAllTimeFrameLogLoading(true);
      setAllTimeFrameLogError(null);
      setAllTimeFrameLog([]);
      try {
        const { start, end } = getRangeForTimeFrame(selectedTimeFrame, selectedDate);
        const url = `${API_URL}/logged-food/get-logged-food-range/${user._id}?start=${start}&end=${end}`;
        console.log('Fetching food log range:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch food log');
        const data = await res.json();
        setAllTimeFrameLog(data.data || []);
      } catch (err) {
        setAllTimeFrameLogError(err.message || 'Failed to fetch food log');
      } finally {
        setAllTimeFrameLogLoading(false);
      }
    };
    fetchLog();
  }, [user?._id, selectedDate, selectedTimeFrame]);

  // Time frame options
  const timeFrames = [
    { key: 'today', label: 'Today' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: '3months', label: '3 Months' },
    { key: '6months', label: '6 Months' },
    { key: '9months', label: '9 Months' },
    { key: 'year', label: 'Year' },
  ];

  // Add state for food details cache
const [foodDetailsMap, setFoodDetailsMap] = useState({});
// Add state to track foodIds currently being fetched (Set for O(1) lookup)
const [fetchingFoodIds, setFetchingFoodIds] = useState(new Set());

// Professional-grade: Fetch food details for all unique foodIds in allTimeFrameLog, avoid duplicate calls
useEffect(() => {
  // Gather all unique foodIds from the log
  const foodIds = new Set();
  allTimeFrameLog.forEach(log =>
    (log.foods || []).forEach(food => {
      if (food.foodId) foodIds.add(food.foodId);
    })
  );
  // Only fetch ids not in cache and not currently being fetched
  const idsToFetch = Array.from(foodIds).filter(
    id => !foodDetailsMap[id] && !fetchingFoodIds.has(id)
  );
  if (idsToFetch.length === 0) return;

  let isMounted = true;
  // Mark these ids as being fetched (atomic update)
  setFetchingFoodIds(prev => {
    const next = new Set(prev);
    idsToFetch.forEach(id => next.add(id));
    return next;
  });

  const fetchDetails = async () => {
    const newDetails = {};
    for (const foodId of idsToFetch) {
      try {
        const res = await fetch(`${API_URL}/get-food-by-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodId }),
        });
        if (res.ok) {
          const data = await res.json();
          newDetails[foodId] = data.food;
        }
      } catch {
        // Optionally handle error per foodId
      }
    }
    if (isMounted && Object.keys(newDetails).length > 0) {
      setFoodDetailsMap(prev => ({ ...prev, ...newDetails }));
    }
    // Remove fetched ids from fetchingFoodIds (atomic update)
    setFetchingFoodIds(prev => {
      const next = new Set(prev);
      idsToFetch.forEach(id => next.delete(id));
      return next;
    });
  };
  fetchDetails();
  return () => { isMounted = false; };
}, [allTimeFrameLog]);

  // Preview rendering
  const renderPreview = () => {
    const safe = (val) => (val === undefined || val === null ? 0 : val);

    // Calculate total macros and micros for the selected time frame
    const totalMacrosAndMicros = (() => {
      let calories = 0, fat = 0, protein = 0, carbs = 0;
      let saturated_fat = 0, polyunsaturated_fat = 0, monounsaturated_fat = 0;
      let cholesterol = 0, sodium = 0, potassium = 0, fiber = 0, sugar = 0;
      let vitamin_a = 0, vitamin_c = 0, calcium = 0, iron = 0;
      allTimeFrameLog.forEach(log => {
        (log.foods || []).forEach(food => {
          const details = food.foodId ? foodDetailsMap[food.foodId] : null;
          let firstServing = null;
          if (details && details.servings && details.servings.serving) {
            const servingsArr = Array.isArray(details.servings.serving)
              ? details.servings.serving
              : [details.servings.serving];
            firstServing = servingsArr[0];
          }
          if (firstServing) {
            calories += Number(firstServing.calories) || 0;
            fat += Number(firstServing.fat) || 0;
            protein += Number(firstServing.protein) || 0;
            carbs += Number(firstServing.carbohydrate) || 0;
            saturated_fat += Number(firstServing.saturated_fat) || 0;
            polyunsaturated_fat += Number(firstServing.polyunsaturated_fat) || 0;
            monounsaturated_fat += Number(firstServing.monounsaturated_fat) || 0;
            cholesterol += Number(firstServing.cholesterol) || 0;
            sodium += Number(firstServing.sodium) || 0;
            potassium += Number(firstServing.potassium) || 0;
            fiber += Number(firstServing.fiber) || 0;
            sugar += Number(firstServing.sugar) || 0;
            vitamin_a += Number(firstServing.vitamin_a) || 0;
            vitamin_c += Number(firstServing.vitamin_c) || 0;
            calcium += Number(firstServing.calcium) || 0;
            iron += Number(firstServing.iron) || 0;
          }
        });
      });
      return {
        calories, fat, protein, carbs,
        saturated_fat, polyunsaturated_fat, monounsaturated_fat,
        cholesterol, sodium, potassium, fiber, sugar,
        vitamin_a, vitamin_c, calcium, iron
      };
    })();

    // Helper to render dataset table
    const renderDatasetTable = (labels, datasets, labelTitle) => (
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12 }}>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151', fontSize: 12 }}>{labelTitle}</Text>
          </View>
          <View style={{ flex: 2, alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151', fontSize: 12 }}>Value</Text>
          </View>
        </View>
        {labels && labels.map((label, idx) => (
          <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' }}>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 5 }}>
              <Text style={{ color: '#374151', fontSize: 12 }}>{label}</Text>
            </View>
            <View style={{ flex: 2, alignItems: 'center', paddingVertical: 5 }}>
              <Text style={{ color: '#111827', fontWeight: '600', fontSize: 12 }}>{datasets && datasets[0]?.data ? safe(datasets[0].data[idx]) : 0}</Text>
            </View>
          </View>
        ))}
      </View>
    );

    // Card component for sections
    const Card = ({ title, icon, children }) => (
      <View
        style={{
          marginBottom: 20,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          padding: 16,
          borderWidth: 1,
          borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
          backgroundColor: isDarkMode ? '#27272a' : '#fff',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          {icon}
          <Text
            style={{
              marginLeft: 8,
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#fff' : '#111827',
            }}
          >
            {title}
          </Text>
        </View>
        {children}
      </View>
    );

    // Highlighted stat
    const Stat = ({ label, value, color }) => (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>{label}</Text>
      </View>
    );

    // Render time frame selector
    const renderTimeFrameSelector = () => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          {timeFrames.map(tf => (
            <TouchableOpacity
              key={tf.key}
              onPress={() => setSelectedTimeFrame(tf.key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                marginRight: 8,
                backgroundColor: selectedTimeFrame === tf.key ? '#2563eb' : '#f3f4f6',
              }}
            >
              <Text
                style={{
                  color: selectedTimeFrame === tf.key ? '#fff' : '#374151',
                  fontWeight: selectedTimeFrame === tf.key ? 'bold' : '600',
                }}
              >
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );

    // Get the card title based on selected time frame
    const getMetricsTitle = () => {
      switch (selectedTimeFrame) {
        case 'today':
          return 'Daily Metrics';
        case 'weekly':
          return 'Weekly Metrics';
        case 'monthly':
          return 'Monthly Metrics';
        case '3months':
          return '3 Months Metrics';
        case '6months':
          return '6 Months Metrics';
        case '9months':
          return '9 Months Metrics';
        case 'year':
          return 'Yearly Metrics';
        default:
          return 'Metrics';
      }
    };

    // Only show daily metrics, remove food label for each date/food, add expand/collapse
    return (
      <View style={{ marginBottom: 24, backgroundColor: isDarkMode ? '#18181b' : undefined }}>
        {/* Time Frame Selector */}
        {renderTimeFrameSelector()}

        {/* Macro & Micro Nutrient Summary */}
        <View style={{ marginBottom: 24 }}>
          {/* --- Macronutrient Overview (Professional, Clear) --- */}
          <Text
            style={{
              fontWeight: 'semibold',
              marginBottom: 8,
              marginLeft: 4,
              fontSize: 14,
              color: isDarkMode ? '#fff' : '#111827',
            }}
          >
            Macronutrient Overview
          </Text>
          <View
            style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 2,
              borderWidth: 1,
              paddingHorizontal: 20,
              paddingVertical: 16,
              marginBottom: 12,
              backgroundColor: isDarkMode ? '#27272a' : '#fff',
              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="food-apple" size={20} color="#2563eb" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#fff' : '#111827',
                }}
              >
                Macronutrients
              </Text>
            </View>
            {/* Macro summary: Calories, Carbs, Protein, Fat */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="fire" size={22} color="#2563eb" />
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Calories
                </Text>
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 20,
                    marginTop: 4,
                    color: isDarkMode ? '#60a5fa' : '#2563eb',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.calories)}
                </Text>
              </View>
              <View style={{ width: 1, height: 40, backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="noodles" size={22} color="#22c55e" />
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Carbs
                </Text>
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 20,
                    marginTop: 4,
                    color: isDarkMode ? '#4ade80' : '#22c55e',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.carbs)}g
                </Text>
              </View>
              <View style={{ width: 1, height: 40, backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="food-steak" size={22} color="#a21caf" />
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Protein
                </Text>
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 20,
                    marginTop: 4,
                    color: isDarkMode ? '#c084fc' : '#a21caf',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.protein)}g
                </Text>
              </View>
              <View style={{ width: 1, height: 40, backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="peanut" size={22} color="#f59e42" />
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Fat
                </Text>
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 20,
                    marginTop: 4,
                    color: isDarkMode ? '#fde68a' : '#f59e42',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.fat)}g
                </Text>
              </View>
            </View>
          </View>
          {/* --- End Macronutrient Overview --- */}
          {/* Macro & Micro Nutrient Summary */}
        <View style={{ marginBottom: 24 }}>
          {/* Carbohydrates Card */}
          <View
            style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 4,
              borderWidth: 1,
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginBottom: 16,
              backgroundColor: isDarkMode ? '#27272a' : '#fff',
              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="grain" size={22} color="#22c55e" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#fff' : '#111827',
                }}
              >
                Carbohydrates
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="grain" size={16} color="#22c55e" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Carbs:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#4ade80' : '#22c55e',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.carbs)}g
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="grain" size={16} color="#a21caf" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Fiber:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#c084fc' : '#a21caf',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.fiber)}g
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="candy-outline" size={16} color="#a21caf" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Sugar:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#c084fc' : '#a21caf',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.sugar)}g
                </Text>
              </View>
            </View>
          </View>
          {/* Fats Card */}
          <View
            style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 4,
              borderWidth: 1,
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginBottom: 16,
              backgroundColor: isDarkMode ? '#27272a' : '#fff',
              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="water" size={22} color="#f59e42" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#fff' : '#111827',
                }}
              >
                Fats
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="water" size={16} color="#10b981" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Total Fat:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#fde68a' : '#f59e42',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.fat)}g
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="water" size={16} color="#10b981" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Sat. Fat:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#34d399' : '#10b981',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.saturated_fat)}g
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="water-percent" size={16} color="#10b981" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Polyunsat. Fat:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#34d399' : '#10b981',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.polyunsaturated_fat)}g
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="water-outline" size={16} color="#10b981" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Monounsat. Fat:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#34d399' : '#10b981',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.monounsaturated_fat)}g
                </Text>
              </View>
            </View>
          </View>
          {/* Minerals Card */}
          <View
            style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 4,
              borderWidth: 1,
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginBottom: 16,
              backgroundColor: isDarkMode ? '#27272a' : '#fff',
              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="bone" size={22} color="#6366f1" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#fff' : '#111827',
                }}
              >
                Minerals
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="egg-outline" size={16} color="#f59e42" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Cholesterol:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#fde68a' : '#f59e42',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.cholesterol)}mg
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="shaker-outline" size={16} color="#f59e42" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Sodium:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#fde68a' : '#f59e42',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.sodium)}mg
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="fruit-pineapple" size={16} color="#f59e42" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Potassium:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#fde68a' : '#f59e42',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.potassium)}mg
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="bone" size={16} color="#6366f1" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Calcium:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#818cf8' : '#6366f1',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.calcium)}mg
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="alpha-i-circle-outline" size={16} color="#6366f1" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Iron:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#818cf8' : '#6366f1',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.iron)}mg
                </Text>
              </View>
            </View>
          </View>
          {/* Vitamins Card */}
          <View
            style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 4,
              borderWidth: 1,
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginBottom: 16,
              backgroundColor: isDarkMode ? '#27272a' : '#fff',
              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="leaf" size={22} color="#059669" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#fff' : '#111827',
                }}
              >
                Vitamins
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="alpha-a-circle-outline" size={16} color="#db2777" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Vit. A:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#f472b6' : '#db2777',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.vitamin_a)} IU
                </Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="alpha-c-circle-outline" size={16} color="#db2777" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: isDarkMode ? '#a1a1aa' : '#6b7280',
                  }}
                >
                  Vit. C:
                </Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: '600',
                    color: isDarkMode ? '#f472b6' : '#db2777',
                  }}
                >
                  {Math.round(totalMacrosAndMicros.vitamin_c)}mg
                </Text>
              </View>
            </View>
          </View>
        </View>


        </View>

        {/* Metrics Card with dynamic title */}
        <Card
          title="Daily Metrics"
          icon={<MaterialCommunityIcons name="calendar-today" size={22} color="#f59e42" />}
        >
          {allTimeFrameLogLoading ? (
            <Text style={{ color: isDarkMode ? '#a1a1aa' : '#9ca3af' }}>Loading food log...</Text>
          ) : allTimeFrameLogError ? (
            <Text style={{ color: isDarkMode ? '#f87171' : '#ef4444' }}>{allTimeFrameLogError}</Text>
          ) : !allTimeFrameLog.length ? (
            <Text style={{ color: isDarkMode ? '#a1a1aa' : '#9ca3af' }}>No food logged for this time frame.</Text>
          ) : (
            <View>
              {[...allTimeFrameLog].reverse().map((log, idx) => (
                <View key={idx} style={{ marginBottom: 12 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isDarkMode ? '#27272a' : '#f9fafb',
                    }}
                    onPress={() => toggleExpandDay(idx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: isDarkMode ? '#fff' : '#374151',
                      }}
                    >
                      {log.date}
                    </Text>
                    <MaterialCommunityIcons
                      name={expandedDays[idx] ? "chevron-up" : "chevron-down"}
                      size={22}
                      color={isDarkMode ? "#818cf8" : "#6366f1"}
                    />
                  </TouchableOpacity>
                  {expandedDays[idx] && (
                    <View style={{ marginTop: 8 }}>
                      {/* Show only the foods list, no food label */}
                      {log.foods && log.foods.length > 0 ? (
                        log.foods.map((food, fidx) => {
                          const details = food.foodId ? foodDetailsMap[food.foodId] : null;
                          let firstServing = null;
                          if (details && details.servings && details.servings.serving) {
                            const servingsArr = Array.isArray(details.servings.serving)
                              ? details.servings.serving
                              : [details.servings.serving];
                            firstServing = servingsArr[0];
                          }
                          return (
                            <View key={fidx} style={{ marginBottom: 8, paddingLeft: 8 }}>
                              {/* Show food name and serving details if available */}
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '600',
                                  marginBottom: 4,
                                  color: isDarkMode ? '#fff' : '#374151',
                                }}
                              >
                                {details?.food_name || food.foodId}
                              </Text>
                              {firstServing ? (
                                <View
                                  style={{
                                    paddingLeft: 8,
                                    borderWidth: 1,
                                    borderRadius: 8,
                                    backgroundColor: isDarkMode ? '#18181b' : '#f9fafb',
                                    padding: 8,
                                    borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                                  }}
                                >
                                  {/* Top fitness app style: grid/row layout, icons, color highlights */}
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="food-variant" size={14} color="#6366f1" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Serving:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fff' : '#111827' }}>{firstServing.serving_description || 0}</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="scale" size={14} color="#10b981" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Amount:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fff' : '#111827' }}>{firstServing.metric_serving_amount || 0} {firstServing.metric_serving_unit || 0}</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="fire" size={14} color="#f59e42" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Calories:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fdba74' : '#f59e42' }}>{firstServing.calories || 0}kcal</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="noodles" size={14} color="#22c55e" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Carbs:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#4ade80' : '#22c55e' }}>{firstServing.carbohydrate || 0}g</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="food-steak" size={14} color="#a21caf" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Protein:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#c084fc' : '#a21caf' }}>{firstServing.protein || 0}g</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="peanut" size={14} color="#f59e42" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Fat:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fde68a' : '#f59e42' }}>{firstServing.fat || 0}g</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="water" size={14} color="#10b981" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Sat. Fat:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#34d399' : '#10b981' }}>{firstServing.saturated_fat || 0}g</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="water-percent" size={14} color="#10b981" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Polyunsat.:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#34d399' : '#10b981' }}>{firstServing.polyunsaturated_fat || 0}g</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="water-outline" size={14} color="#10b981" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Monounsat.:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#34d399' : '#10b981' }}>{firstServing.monounsaturated_fat || 0}g</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="egg-outline" size={14} color="#f59e42" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Cholest.:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fde68a' : '#f59e42' }}>{firstServing.cholesterol || 0}mg</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="shaker-outline" size={14} color="#f59e42" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Sodium:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fde68a' : '#f59e42' }}>{firstServing.sodium || 0}mg</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="fruit-pineapple" size={14} color="#f59e42" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Potassium:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#fde68a' : '#f59e42' }}>{firstServing.potassium || 0}mg</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="grain" size={14} color="#a21caf" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Fiber:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#c084fc' : '#a21caf' }}>{firstServing.fiber || 0}g</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="candy-outline" size={14} color="#a21caf" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Sugar:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#c084fc' : '#a21caf' }}>{firstServing.sugar || 0}g</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="alpha-a-circle-outline" size={14} color="#db2777" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Vit. A:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#f472b6' : '#db2777' }}>{firstServing.vitamin_a || 0}mg</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="alpha-c-circle-outline" size={14} color="#db2777" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Vit. C:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#f472b6' : '#db2777' }}>{firstServing.vitamin_c || 0}mg</Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="bone" size={14} color="#6366f1" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Calcium:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#818cf8' : '#6366f1' }}>{firstServing.calcium || 0}mg</Text>
                                    </View>
                                    <View style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                                      <MaterialCommunityIcons name="alpha-i-circle-outline" size={14} color="#6366f1" />
                                      <Text style={{ marginLeft: 4, fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>Iron:</Text>
                                      <Text style={{ marginLeft: 4, fontWeight: '600', color: isDarkMode ? '#818cf8' : '#6366f1' }}>{firstServing.iron || 0}mg</Text>
                                    </View>
                                  </View>
                                </View>
                              ) : details ? (
                                <Text
                                  style={{
                                    fontSize: 12,
                                    paddingLeft: 8,
                                    color: isDarkMode ? '#a1a1aa' : '#9ca3af',
                                  }}
                                >
                                  No serving details found.
                                </Text>
                              ) : (
                                <Text
                                  style={{
                                    fontSize: 12,
                                    paddingLeft: 8,
                                    color: isDarkMode ? '#a1a1aa' : '#9ca3af',
                                  }}
                                >
                                  Loading details...
                                </Text>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        <Text
                          style={{
                            fontSize: 12,
                            paddingLeft: 8,
                            color: isDarkMode ? '#a1a1aa' : '#9ca3af',
                          }}
                        >
                          No foods logged.
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    );
  };

  // Export handlers
  const handleExport = async (type) => {
    setExporting(true);
    let content = '';
    let ext = '';
    let fileUri = '';
    try {
      if (type === 'pdf') {
        // Prepare data for PDF for the selected time frame
        // Calculate macro/micro summary for the selected time frame
        const macroSummary = {
          calories: 0, fat: 0, protein: 0, carbs: 0
        };
        const carbs = [
          { label: 'Carbs', value: 0, color: '#22c55e' },
          { label: 'Fiber', value: 0, color: '#a21caf' },
          { label: 'Sugar', value: 0, color: '#a21caf' }
        ];
        const fats = [
          { label: 'Total Fat', value: 0, color: '#f59e42' },
          { label: 'Sat. Fat', value: 0, color: '#10b981' },
          { label: 'Polyunsat. Fat', value: 0, color: '#10b981' },
          { label: 'Monounsat. Fat', value: 0, color: '#10b981' }
        ];
        const minerals = [
          { label: 'Cholesterol', value: 0, color: '#f59e42' },
          { label: 'Sodium', value: 0, color: '#f59e42' },
          { label: 'Potassium', value: 0, color: '#f59e42' },
          { label: 'Calcium', value: 0, color: '#6366f1' },
          { label: 'Iron', value: 0, color: '#6366f1' }
        ];
        const vitamins = [
          { label: 'Vit. A', value: 0, color: '#db2777' },
          { label: 'Vit. C', value: 0, color: '#db2777' }
        ];

        // Aggregate macro/micro data from allTimeFrameLog
        allTimeFrameLog.forEach(log => {
          (log.foods || []).forEach(food => {
            const details = food.foodId ? foodDetailsMap[food.foodId] : {};
            let firstServing = null;
            if (details && details.servings && details.servings.serving) {
              const servingsArr = Array.isArray(details.servings.serving)
                ? details.servings.serving
                : [details.servings.serving];
              firstServing = servingsArr[0];
            }
            if (firstServing) {
              macroSummary.calories += Number(firstServing.calories) || 0;
              macroSummary.fat += Number(firstServing.fat) || 0;
              macroSummary.protein += Number(firstServing.protein) || 0;
              macroSummary.carbs += Number(firstServing.carbohydrate) || 0;
              carbs[0].value += Number(firstServing.carbohydrate) || 0;
              carbs[1].value += Number(firstServing.fiber) || 0;
              carbs[2].value += Number(firstServing.sugar) || 0;
              fats[0].value += Number(firstServing.fat) || 0;
              fats[1].value += Number(firstServing.saturated_fat) || 0;
              fats[2].value += Number(firstServing.polyunsaturated_fat) || 0;
              fats[3].value += Number(firstServing.monounsaturated_fat) || 0;
              minerals[0].value += Number(firstServing.cholesterol) || 0;
              minerals[1].value += Number(firstServing.sodium) || 0;
              minerals[2].value += Number(firstServing.potassium) || 0;
              minerals[3].value += Number(firstServing.calcium) || 0;
              minerals[4].value += Number(firstServing.iron) || 0;
              vitamins[0].value += Number(firstServing.vitamin_a) || 0;
              vitamins[1].value += Number(firstServing.vitamin_c) || 0;
            }
          });
        });

        // Prepare food log data for PDF
        const foodLogs = [...allTimeFrameLog].reverse().map(log => ({
          date: log.date,
          foods: (log.foods || []).map(food => {
            const details = food.foodId ? foodDetailsMap[food.foodId] : {};
            let firstServing = null;
            if (details && details.servings && details.servings.serving) {
              const servingsArr = Array.isArray(details.servings.serving)
                ? details.servings.serving
                : [details.servings.serving];
              firstServing = servingsArr[0];
            }
            return {
              foodId: food.foodId,
              details,
              serving: firstServing || {}
            };
          })
        }));

        content = convertToPDF({
          timeFrame: selectedTimeFrame,
          macroSummary,
          carbs,
          fats,
          minerals,
          vitamins,
          foodLogs
        });
        ext = 'pdf';
        const { uri } = await Print.printToFileAsync({ html: content });
        fileUri = uri;
      } else if (type === 'csv') {
        // Use current log and food details for CSV
        content = convertToCSV({ allTimeFrameLog, foodDetailsMap });
        ext = 'csv';
        fileUri = FileSystem.cacheDirectory + `nutrix_export_${Date.now()}.${ext}`;
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      } else if (type === 'excel') {
        // Use current log and food details for Excel (CSV)
        content = convertToExcel({ allTimeFrameLog, foodDetailsMap });
        ext = 'csv';
        fileUri = FileSystem.cacheDirectory + `nutrix_export_${Date.now()}.${ext}`;
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      }
      if (Platform.OS === 'web') {
        await Share.share({ url: fileUri });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Exported', `File saved to: ${fileUri}`);
      }
      if (type === 'pdf') {
        Alert.alert('Success', 'PDF exported successfully.');
      }
    } catch (err) {
      Alert.alert('Export failed', err.message || 'Could not export file.');
    } finally {
      setExporting(false);
    }
  };

  // Header export icons as a component
  const HeaderExportIcons = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        onPress={() => handleExport('pdf')}
        disabled={exporting}
        style={{ marginHorizontal: 4 }}
      >
        <MaterialCommunityIcons name="file-pdf-box" size={22} color="#ef4444" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleExport('excel')}
        disabled={exporting}
        style={{ marginHorizontal: 4 }}
      >
        <MaterialCommunityIcons name="microsoft-excel" size={22} color="#10b981" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleExport('csv')}
        disabled={exporting}
        style={{ marginHorizontal: 4 }}
      >
        <MaterialCommunityIcons name="file-table" size={22} color="#6366f1" />
      </TouchableOpacity>
      {exporting && (
        <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 8 }} />
      )}
    </View>
  );

// --- Skeleton Loader Component ---
const SkeletonLoader = () => (
  <View>
    {/* Macro skeleton */}
    <View
      style={{
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        backgroundColor: isDarkMode ? '#27272a' : '#f3f4f6',
      }}
    >
      <View
        style={{
          height: 20,
          width: 128,
          borderRadius: 8,
          marginBottom: 12,
          backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
        }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <View
              style={{
                height: 24,
                width: 24,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
              }}
            />
            <View
              style={{
                height: 16,
                width: 40,
                borderRadius: 8,
                marginBottom: 4,
                backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
              }}
            />
            <View
              style={{
                height: 16,
                width: 32,
                borderRadius: 8,
                backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
              }}
            />
          </View>
        ))}
      </View>
    </View>
    {/* Cards skeleton */}
    {[1, 2, 3, 4].map(i => (
      <View
        key={i}
        style={{
          borderRadius: 16,
          marginBottom: 16,
          padding: 20,
          backgroundColor: isDarkMode ? '#27272a' : '#f3f4f6',
        }}
      >
        <View
          style={{
            height: 20,
            width: 112,
            borderRadius: 8,
            marginBottom: 12,
            backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
          }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(j => (
            <View key={j} style={{ width: '50%', marginBottom: 12 }}>
              <View
                style={{
                  height: 16,
                  width: 80,
                  borderRadius: 8,
                  marginBottom: 4,
                  backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
                }}
              />
              <View
                style={{
                  height: 16,
                  width: 48,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
                }}
              />
            </View>
          ))}
        </View>
      </View>
    ))}
    {/* Food log skeleton */}
    <View
      style={{
        borderRadius: 16,
        padding: 20,
        backgroundColor: isDarkMode ? '#27272a' : '#f3f4f6',
      }}
    >
      <View
        style={{
          height: 20,
          width: 128,
          borderRadius: 8,
          marginBottom: 12,
          backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
        }}
      />
      {[1, 2].map(i => (
        <View key={i} style={{ marginBottom: 12 }}>
          <View
            style={{
              height: 16,
              width: 96,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
            }}
          />
          <View
            style={{
              height: 16,
              width: 160,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
            }}
          />
          <View
            style={{
              height: 16,
              width: 128,
              borderRadius: 8,
              backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb',
            }}
          />
        </View>
      ))}
    </View>
  </View>
);

  // Show skeleton loader immediately when component mounts (before data loads)
  useEffect(() => {
    setAllTimeFrameLogLoading(true);
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? '#18181b' : '#fff' }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderColor: isDarkMode ? '#27272a' : '#f3f4f6',
          backgroundColor: isDarkMode ? '#18181b' : '#fff',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#fff" : "#374151"} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              marginLeft: 8,
              color: isDarkMode ? '#fff' : '#111827',
            }}
          >
            Export Data
          </Text>
        </View>
        <HeaderExportIcons />
      </View>
      <ScrollView
        style={{ paddingHorizontal: 16, paddingTop: 16, backgroundColor: isDarkMode ? '#18181b' : '#fff' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Only show skeleton or preview, never show "No data" until API returns */}
        {allTimeFrameLogLoading
          ? <SkeletonLoader />
          : renderPreview()
        }
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExportData;
