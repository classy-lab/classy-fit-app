import type { GymVideoCategory } from '../utils/gymVideosApi'

export type SuggestedGymVideo = {
  /** YouTube video id; also used to detect videos the gym has already added. */
  youtubeId: string
  title: string
  description: string
  category: GymVideoCategory
  /** Channel or organisation that published the video. */
  source: string
  /** Running time as shown on YouTube. */
  duration: string
}

// Every id below was checked against YouTube's oEmbed lookup (public and embeddable) on 2026-10-02.
// Descriptions are written for gym members; the owner can edit them after adding.
export const suggestedGymVideos: SuggestedGymVideo[] = [
  {
    youtubeId: 'Bj_LahW_y6o',
    title: 'Beginner Strength Training at the Gym',
    description:
      'A university exercise scientist walks new lifters through getting started with strength training at the gym.',
    category: 'workout_suggestions',
    source: 'UC Davis Health',
    duration: '13:49',
  },
  {
    youtubeId: '1v0yYf0PiRk',
    title: 'Beginner Workout: Machines Only',
    description:
      'A simple full workout that uses only gym machines, a good starting point if free weights feel intimidating.',
    category: 'workout_suggestions',
    source: 'Brix Glover',
    duration: '10:33',
  },
  {
    youtubeId: 'eMjyvIQbn9M',
    title: 'A Minimalist Workout Plan for Busy Members',
    description:
      'A science-based plan built around short sessions of under 45 minutes, ideal when time is tight.',
    category: 'workout_suggestions',
    source: 'Jeff Nippard',
    duration: '13:08',
  },
  {
    youtubeId: 'oBs-PE34x7g',
    title: 'How to Use Basic Gym Equipment',
    description:
      'A beginner-friendly tour of the equipment you will find on the gym floor, with a full-body workout to try.',
    category: 'proper_machine_usage',
    source: 'SELF',
    duration: '12:54',
  },
  {
    youtubeId: 'AOpi-p0cJkc',
    title: 'Lat Pulldown: A Beginner\u2019s Guide',
    description: 'A quick walkthrough of how to set up and use the lat pulldown machine.',
    category: 'proper_machine_usage',
    source: 'SilverSneakers',
    duration: '2:18',
  },
  {
    youtubeId: 'n8TOta_pfr4',
    title: 'How to Use the Chest Press Machine',
    description: 'A short demo of using the chest press machine correctly.',
    category: 'proper_machine_usage',
    source: 'LIVESTRONG',
    duration: '1:20',
  },
  {
    youtubeId: 'W1SD96lrudY',
    title: 'Leg Press: How to Do It Correctly',
    description: 'Training tips from Jay Cutler on getting the most out of the leg press.',
    category: 'proper_machine_usage',
    source: 'Muscle & Strength',
    duration: '4:29',
  },
  {
    youtubeId: 'hlTthXUxSZw',
    title: 'Bench Press Safety: Setting the Safety Pins',
    description:
      'Shows how to set the safety pins in the rack so you can bench press safely, even when training alone.',
    category: 'safety_precautions',
    source: 'Starting Strength',
    duration: '4:06',
  },
  {
    youtubeId: '2qWoegDcHMI',
    title: '5 Beginner Gym Mistakes to Avoid',
    description: 'Common mistakes new members make and how to steer clear of them.',
    category: 'safety_precautions',
    source: 'PictureFit',
    duration: '6:07',
  },
  {
    youtubeId: 'EZ7OkjYGhdY',
    title: 'Treadmill Mistakes to Avoid',
    description: 'A physical therapist explains common treadmill mistakes and how to correct them.',
    category: 'safety_precautions',
    source: 'Rehab and Revive',
    duration: '5:35',
  },
  {
    youtubeId: 'MncQw-H3MPU',
    title: 'How to Warm Up Before Lifting',
    description: 'A proper warm-up routine to do before your weight training session.',
    category: 'warm_ups_and_recovery',
    source: 'Jeremy Ethier',
    duration: '7:38',
  },
  {
    youtubeId: '7_Gmj7awnWY',
    title: '15-Minute Post-Workout Stretch',
    description:
      'A follow-along stretching routine for flexibility and injury prevention after your workout.',
    category: 'warm_ups_and_recovery',
    source: 'Kaleigh Cohen Strength',
    duration: '15:32',
  },
  {
    youtubeId: 'Oz4xHEgMaLY',
    title: '10-Minute Full-Body Foam Roller Routine',
    description: 'Follow along with a full-body foam rolling routine to help with recovery.',
    category: 'warm_ups_and_recovery',
    source: 'Tom Peto Training',
    duration: '10:16',
  },
  {
    youtubeId: '8ISoZsWzwjk',
    title: 'Gym Etiquette Explained',
    description:
      'The unwritten rules of the gym explained so every member can train comfortably and respectfully.',
    category: 'other',
    source: 'trainer winny',
    duration: '8:21',
  },
  {
    youtubeId: 'Pok0Jg2JAkE',
    title: 'Protein and Muscle Building, Explained',
    description: 'A science-based look at how to use protein to build muscle.',
    category: 'other',
    source: 'Jeff Nippard',
    duration: '10:20',
  },
]

export const getSuggestedVideoUrl = (video: SuggestedGymVideo) =>
  `https://www.youtube.com/watch?v=${video.youtubeId}`

export const getSuggestedVideoThumbnail = (video: SuggestedGymVideo) =>
  `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
